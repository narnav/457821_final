

# Lumo – Python Basics Curriculum (v1)

This document defines the **Python Basics** learning path for Lumo v1.

The curriculum is designed for **absolute beginners** and focuses on building
real programming understanding, problem-solving skills, and confidence.

This file is **human-readable** and serves as the pedagogical source of truth.
The corresponding `python_basic.yaml` file will later encode this structure for
programmatic use by the system.

---

## Curriculum Principles

- Learners start with **no prior programming experience**
- Understanding and reasoning are prioritized over syntax memorization
- Practice and feedback are more important than explanations
- The AI mentor **never provides full solutions**
- Errors and debugging are treated as learning tools

Learning follows a consistent loop:

> Explanation → Practice → Feedback → Improvement

---

## Exercise Design & Adaptation Model

Exercises are intentionally defined **outside** this document in a dedicated examples file:

- `python_basic_examples.md`

This separation keeps the curriculum focused on *learning goals and pedagogy*, while allowing exercises to evolve independently.

### Exercise Categories
Each module draws from a shared pool of exercise types:
- **Guided Practice** – predict, modify, or complete existing code
- **Debugging Exercises** – analyze and fix broken or misleading code
- **Independent Mini Tasks** – small, constrained programs written from scratch

### Adaptive Exercise Selection (Core Feature)
The AI mentor dynamically selects and sequences exercises based on learner behavior:
- If the learner runs code without reasoning → prioritize **prediction exercises**
- If the learner guesses or changes code randomly → prioritize **debugging exercises**
- If the learner demonstrates consistent understanding → introduce **independent tasks**

This adaptive loop ensures learners build **reasoning and confidence**, not trial-and-error habits.

---

## Module 1 – Thinking Like a Programmer

### Goal
Understand what a program is, how Python executes code, and how to reason about code behavior.

### Core Concepts
- What a computer program is
- Instructions and execution order
- Input → Processing → Output
- Reading code before writing code

### Common Beginner Mistakes
- Treating code as magic instead of instructions
- Writing code without understanding what each line does
- Guessing instead of tracing execution

### Practice Types
- Predict program output
- Modify existing code
- Explain code line by line in plain language

### AI Mentor Behavior
- Ask learners to predict behavior before execution
- Encourage tracing code step by step
- Avoid asking learners to write code from scratch

---

## Module 2 – Variables and Data Types

### Goal
Store information in variables and understand how Python represents data.

### Core Concepts
- Variables and assignment
- Naming conventions
- Data types: int, float, string, boolean
- Basic arithmetic operations

### Common Beginner Mistakes
- Confusing numbers and strings
- Using unclear variable names
- Overwriting variables unintentionally

### Practice Types
- Fix broken variable assignments
- Rename poorly named variables
- Predict values after reassignment

### AI Mentor Behavior
- Highlight naming issues and suggest improvements
- Explain type-related errors clearly
- Encourage descriptive variable names

---

## Module 3 – Conditions and Logical Thinking

### Goal
Make decisions in code using conditional logic.

### Core Concepts
- Boolean values
- Comparison operators
- if / elif / else statements
- Logical operators: and, or, not

### Common Beginner Mistakes
- Using = instead of ==
- Forgetting colons or indentation
- Over-nesting conditionals

### Practice Types
- Complete conditional blocks
- Simplify nested conditions
- Trace which branch executes

### AI Mentor Behavior
- Ask learners to walk through conditions verbally
- Encourage simplifying logic
- Avoid revealing correct conditions directly

---

## Module 4 – Loops and Repetition

### Goal
Repeat actions safely and predictably using loops.

### Core Concepts
- for loops
- while loops
- range()
- Loop termination and infinite loops

### Common Beginner Mistakes
- Off-by-one errors
- Infinite loops
- Misunderstanding range boundaries

### Practice Types
- Predict loop iterations
- Fix infinite loops
- Debug incorrect counters

### AI Mentor Behavior
- Ask how many times a loop runs before execution
- Warn about potential infinite loops
- Encourage step-by-step tracing

---

## Module 5 – Functions and Code Organization

### Goal
Organize code into reusable, readable functions.

### Core Concepts
- Defining functions
- Parameters and arguments
- return values
- Difference between print and return

### Common Beginner Mistakes
- Forgetting to return values
- Confusing print with return
- Writing functions that do too much

### Practice Types
- Refactor repeated code into functions
- Complete function definitions
- Predict function outputs

### AI Mentor Behavior
- Ask what the function should return
- Encourage smaller, focused functions
- Highlight duplicated logic

---

## Module 6 – Working with Data Structures

### Goal
Store and manipulate collections of data effectively.

### Core Concepts
- Lists
- Dictionaries
- Indexing and iteration
- Choosing the right data structure

### Common Beginner Mistakes
- Index out of range errors
- Misusing lists instead of dictionaries
- Modifying collections while iterating

### Practice Types
- Fix indexing errors
- Choose appropriate data structures
- Trace iteration over collections

### AI Mentor Behavior
- Ask why a structure was chosen
- Encourage clear iteration patterns
- Explain errors caused by mutation

---

## Mini Projects (Throughout the Curriculum)

Each module includes a small project designed to apply learned concepts.

Examples:
- Number guessing game
- Simple calculator
- List-based task tracker

The AI mentor performs **educational code review**, focusing on:
- Clarity
- Correct reasoning
- Incremental improvement

---

## Final Project – Capstone

### Goal
Demonstrate independent problem-solving and programming ability.

### Project Examples
- Command-line task manager
- Text-based game
- Data processing script

### Evaluation Criteria
- Program works correctly
- Code is readable and organized
- Functions are used appropriately
- Errors are handled gracefully

### AI Mentor Role
- Review structure and reasoning
- Provide feedback without rewriting code
- Encourage reflection on learning progress

---

## Summary

This curriculum is designed to help learners:
- Think like programmers
- Build confidence through practice
- Learn from mistakes
- Write functional Python code independently

The focus is not speed or perfection — it is **understanding and growth**.