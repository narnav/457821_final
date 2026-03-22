"""MVP Diagnostics Engine for Lumo - deterministic static analysis without execution."""
import ast
from enum import Enum
from typing import Optional
from pydantic import BaseModel

from backend.app.observability.logging_config import get_logger

_log = get_logger("core.diagnostics")


class DiagnosticSeverity(str, Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class DiagnosticCode(str, Enum):
    SYNTAX_ERROR = "SYNTAX_ERROR"
    INDENTATION_ERROR = "INDENTATION_ERROR"
    UNDEFINED_NAME = "UNDEFINED_NAME"
    TYPE_MISMATCH_OPERATION = "TYPE_MISMATCH_OPERATION"
    POSSIBLE_INFINITE_LOOP = "POSSIBLE_INFINITE_LOOP"


class Diagnostic(BaseModel):
    model_config = {"frozen": True}
    code: DiagnosticCode
    severity: DiagnosticSeverity
    message: str
    line: int


class DiagnosticsResult(BaseModel):
    model_config = {"frozen": True}
    diagnostics: tuple[Diagnostic, ...]
    has_errors: bool


_BUILTINS = frozenset({
    "True", "False", "None", "print", "len", "range", "int", "str", "float",
    "list", "dict", "set", "tuple", "bool", "input", "type", "abs", "max",
    "min", "sum", "round", "sorted", "reversed", "enumerate", "zip", "map",
    "filter", "open", "isinstance", "hasattr", "getattr", "setattr", "id",
    "repr", "chr", "ord", "all", "any", "iter", "next", "super", "Exception",
    "ValueError", "TypeError", "KeyError", "IndexError", "AttributeError",
    "RuntimeError", "ZeroDivisionError", "FileNotFoundError", "NameError",
})


def _collect_target_names(target: ast.expr) -> set[str]:
    if isinstance(target, ast.Name):
        return {target.id}
    if isinstance(target, (ast.Tuple, ast.List)):
        return {n for elt in target.elts for n in _collect_target_names(elt)}
    return set()


def _iter_same_scope_nodes(node: ast.AST):
    """Yield *node* and its descendants without crossing scope boundaries.

    Scope boundaries (not descended into): FunctionDef, AsyncFunctionDef,
    ClassDef, Lambda, and comprehensions (own scope in Python 3).
    The boundary node itself is still yielded so callers can collect its name.
    """
    yield node
    if isinstance(node, (
        ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda,
        ast.ListComp, ast.SetComp, ast.GeneratorExp, ast.DictComp,
    )):
        return
    for child in ast.iter_child_nodes(node):
        yield from _iter_same_scope_nodes(child)


def _iter_module_scope_nodes(tree: ast.Module):
    """Yield all AST nodes reachable at module scope."""
    for stmt in tree.body:
        yield from _iter_same_scope_nodes(stmt)


def _collect_definitions(tree: ast.Module) -> set[str]:
    """Collect names defined at module scope only."""
    defined: set[str] = set()
    for node in _iter_module_scope_nodes(tree):
        if isinstance(node, ast.Assign):
            for t in node.targets:
                defined.update(_collect_target_names(t))
        elif isinstance(node, (ast.AnnAssign, ast.AugAssign)) and node.target:
            defined.update(_collect_target_names(node.target))
        elif isinstance(node, ast.For):
            defined.update(_collect_target_names(node.target))
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            defined.add(node.name)
        elif isinstance(node, ast.ClassDef):
            defined.add(node.name)
        elif isinstance(node, ast.Import):
            for alias in node.names:
                defined.add(alias.asname or alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                defined.add(alias.asname or alias.name)
        elif isinstance(node, ast.ExceptHandler) and node.name:
            defined.add(node.name)
        elif isinstance(node, ast.With):
            for item in node.items:
                if item.optional_vars:
                    defined.update(_collect_target_names(item.optional_vars))
    return defined


def _check_undefined_names(tree: ast.Module) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    defined = _collect_definitions(tree)
    seen_undefined: set[str] = set()

    for node in _iter_module_scope_nodes(tree):
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
            name = node.id
            if name not in _BUILTINS and name not in defined and name not in seen_undefined:
                diagnostics.append(Diagnostic(
                    code=DiagnosticCode.UNDEFINED_NAME,
                    severity=DiagnosticSeverity.WARNING,
                    message=f"The name '{name}' might not be defined before it is used here.",
                    line=node.lineno,
                ))
                seen_undefined.add(name)
    return diagnostics


def _get_names_in_expr(node: ast.expr) -> set[str]:
    return {c.id for c in ast.walk(node) if isinstance(c, ast.Name)}


def _get_modified_names(body: list[ast.stmt]) -> set[str]:
    modified: set[str] = set()
    for node in body:
        for child in ast.walk(node):
            if isinstance(child, ast.Assign):
                for t in child.targets:
                    if isinstance(t, ast.Name):
                        modified.add(t.id)
            elif isinstance(child, (ast.AugAssign, ast.AnnAssign)):
                if isinstance(child.target, ast.Name):
                    modified.add(child.target.id)
    return modified


def _check_infinite_loops(tree: ast.Module) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []

    for node in ast.walk(tree):
        if not isinstance(node, ast.While):
            continue
        # Skip while True - often intentional with break
        if isinstance(node.test, ast.Constant) and node.test.value is True:
            continue

        condition_names = _get_names_in_expr(node.test)
        if not condition_names:
            continue

        modified = _get_modified_names(node.body)
        if condition_names.intersection(modified):
            continue

        # Check for break/return
        has_exit = any(isinstance(c, (ast.Break, ast.Return)) for c in ast.walk(node))
        if not has_exit:
            diagnostics.append(Diagnostic(
                code=DiagnosticCode.POSSIBLE_INFINITE_LOOP,
                severity=DiagnosticSeverity.WARNING,
                message="This loop might run forever because the variables in its condition are not changed inside the loop.",
                line=node.lineno,
            ))
    return diagnostics


def _infer_type(node: ast.expr, var_types: dict[str, str]) -> Optional[str]:
    if isinstance(node, ast.Constant):
        if isinstance(node.value, str):
            return "str"
        if isinstance(node.value, bool):
            return "bool"
        if isinstance(node.value, int):
            return "int"
        if isinstance(node.value, float):
            return "float"
    elif isinstance(node, ast.Str):
        return "str"
    elif isinstance(node, ast.Num):
        return "int" if isinstance(node.n, int) else "float"
    elif isinstance(node, ast.Name):
        return var_types.get(node.id)
    return None


def _check_type_mismatch(tree: ast.Module) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    var_types: dict[str, str] = {}

    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            target = node.targets[0]
            if isinstance(target, ast.Name):
                inferred = _infer_type(node.value, var_types)
                if inferred:
                    var_types[target.id] = inferred

        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            left_type = _infer_type(node.left, var_types)
            right_type = _infer_type(node.right, var_types)
            if left_type and right_type:
                is_mismatch = (
                    (left_type == "str" and right_type in ("int", "float"))
                    or (left_type in ("int", "float") and right_type == "str")
                )
                if is_mismatch:
                    diagnostics.append(Diagnostic(
                        code=DiagnosticCode.TYPE_MISMATCH_OPERATION,
                        severity=DiagnosticSeverity.ERROR,
                        message="This operation tries to combine text and a number, which is not allowed in Python.",
                        line=node.lineno,
                    ))
    return diagnostics


def analyze_code(code: str, trace_id: Optional[str] = None) -> DiagnosticsResult:
    """Analyze Python code and return diagnostics without executing it."""
    _log.debug(
        "analyze_code START code_len=%d", len(code),
        extra={"stage": "diagnostics", "trace_id": trace_id},
    )
    diagnostics: list[Diagnostic] = []

    # Step 1: Try to parse
    try:
        tree = ast.parse(code)
    except IndentationError as e:
        _log.info(
            "analyze_code END parse_error=INDENTATION_ERROR line=%d",
            e.lineno or 1,
            extra={"stage": "diagnostics", "trace_id": trace_id},
        )
        return DiagnosticsResult(
            diagnostics=(Diagnostic(
                code=DiagnosticCode.INDENTATION_ERROR,
                severity=DiagnosticSeverity.ERROR,
                message="The indentation (spacing at the start of a line) is incorrect here.",
                line=e.lineno or 1,
            ),),
            has_errors=True,
        )
    except SyntaxError as e:
        _log.info(
            "analyze_code END parse_error=SYNTAX_ERROR line=%d",
            e.lineno or 1,
            extra={"stage": "diagnostics", "trace_id": trace_id},
        )
        return DiagnosticsResult(
            diagnostics=(Diagnostic(
                code=DiagnosticCode.SYNTAX_ERROR,
                severity=DiagnosticSeverity.ERROR,
                message="There is something wrong with the structure of the code here.",
                line=e.lineno or 1,
            ),),
            has_errors=True,
        )

    # Step 2: Run AST-based checks
    diagnostics.extend(_check_undefined_names(tree))
    diagnostics.extend(_check_infinite_loops(tree))
    diagnostics.extend(_check_type_mismatch(tree))
    diagnostics.sort(key=lambda d: d.line)

    error_count = sum(1 for d in diagnostics if d.severity == DiagnosticSeverity.ERROR)
    warning_count = sum(1 for d in diagnostics if d.severity == DiagnosticSeverity.WARNING)
    codes = [d.code.value for d in diagnostics[:3]]  # first 3 codes only

    _log.info(
        "analyze_code END errors=%d warnings=%d codes=%s",
        error_count, warning_count, codes,
        extra={"stage": "diagnostics", "trace_id": trace_id},
    )

    return DiagnosticsResult(
        diagnostics=tuple(diagnostics),
        has_errors=any(d.severity == DiagnosticSeverity.ERROR for d in diagnostics),
    )
