"""
Model factories for Lumo using polyfactory.

Generates realistic mock data for testing and development.
All foreign key relationships are properly managed.
"""

import json
from typing import Any
from uuid import UUID

from polyfactory import Use

from backend.app.core.constants import CURRICULUM_VERSION
from polyfactory.factories.pydantic_factory import ModelFactory

from backend.app.db.models import Attempt, ExerciseInstance, User, UserProfileRecord, UserState


class UserFactory(ModelFactory[User]):
    """Factory for generating realistic User instances."""

    __model__ = User

    # Override fields to generate realistic data
    first_name = Use(lambda: ModelFactory.__faker__.first_name())
    last_name = Use(lambda: ModelFactory.__faker__.last_name())
    email = Use(lambda: ModelFactory.__faker__.unique.email())
    profile_image_url = Use(
        lambda: f"https://api.dicebear.com/7.x/avatars/svg?seed={ModelFactory.__faker__.uuid4()}"
    )
    age = Use(lambda: ModelFactory.__faker__.random_int(min=13, max=80))
    gender = Use(
        lambda: ModelFactory.__faker__.random_element(
            ["male", "female", "non-binary", "prefer_not_to_say"]
        )
    )


class UserStateFactory(ModelFactory[UserState]):
    """Factory for generating UserState instances."""

    __model__ = UserState

    curriculum_version = Use(lambda: CURRICULUM_VERSION)
    module_index = Use(lambda: ModelFactory.__faker__.random_int(min=0, max=5))
    exercise_index = Use(lambda: ModelFactory.__faker__.random_int(min=0, max=10))
    pacing = Use(
        lambda: ModelFactory.__faker__.random_element(["slow", "normal", "fast"])
    )


class UserProfileRecordFactory(ModelFactory[UserProfileRecord]):
    """Factory for generating UserProfileRecord instances."""

    __model__ = UserProfileRecord

    skill_level = Use(
        lambda: ModelFactory.__faker__.random_element(
            ["beginner", "intermediate", "advanced"]
        )
    )
    confidence_score = Use(lambda: round(ModelFactory.__faker__.pyfloat(min_value=0.1, max_value=1.0), 2))
    learning_style = Use(
        lambda: ModelFactory.__faker__.random_element(
            ["visual", "hands-on", "reading", "mixed"]
        )
    )
    initial_track = Use(
        lambda: ModelFactory.__faker__.random_element(
            ["python_fundamentals", "web_basics", "data_intro"]
        )
    )
    preferred_languages_json = Use(lambda: '["en"]')
    raw_input_json = Use(lambda: '{}')


class ExerciseInstanceFactory(ModelFactory[ExerciseInstance]):
    """Factory for generating ExerciseInstance instances."""

    __model__ = ExerciseInstance

    curriculum_version = Use(lambda: CURRICULUM_VERSION)
    module_index = Use(lambda: ModelFactory.__faker__.random_int(min=0, max=5))
    exercise_index = Use(lambda: ModelFactory.__faker__.random_int(min=0, max=10))
    prompt_text = Use(
        lambda: ModelFactory.__faker__.random_element(
            [
                "Write a function that returns the sum of two numbers.",
                "Create a variable named 'greeting' and assign it the value 'Hello'.",
                "Write a for loop that prints numbers 1 to 10.",
                "Define a class called 'Person' with name and age attributes.",
                "Write a function that checks if a number is prime.",
            ]
        )
    )
    metadata_json = Use(
        lambda: json.dumps({"difficulty": "beginner", "tags": ["python", "basics"]})
    )


class AttemptFactory(ModelFactory[Attempt]):
    """Factory for generating Attempt instances."""

    __model__ = Attempt

    code = Use(
        lambda: ModelFactory.__faker__.random_element(
            [
                "def add(a, b):\n    return a + b",
                "greeting = 'Hello'",
                "for i in range(1, 11):\n    print(i)",
                "class Person:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age",
                "def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True",
            ]
        )
    )
    diagnostics_json = Use(
        lambda: json.dumps(
            [
                {
                    "code": "syntax_error",
                    "severity": "error",
                    "message": "Expected ':' at end of line",
                    "line": 1,
                }
            ]
        )
    )
    mentor_response_json = Use(
        lambda: json.dumps(
            {
                "hint": "Check the end of your function definition line for a missing colon.",
                "encouragement": "You're on the right track! Python syntax just takes a bit of practice.",
                "next_action": "Add a ':' at the end of line 1 and try running it again.",
            }
        )
    )


def create_user_with_state(user_id: UUID = None) -> dict[str, Any]:
    """
    Create a User with associated UserState.

    Returns dict with 'user' and 'state' keys.
    """
    user = UserFactory.build()
    if user_id:
        user.id = user_id

    state = UserStateFactory.build(user_id=user.id)

    return {"user": user, "state": state}


def create_user_with_exercise_and_attempt(user_id: UUID = None) -> dict[str, Any]:
    """
    Create a User with ExerciseInstance and Attempt.

    Returns dict with 'user', 'exercise', and 'attempt' keys.
    """
    user = UserFactory.build()
    if user_id:
        user.id = user_id

    exercise = ExerciseInstanceFactory.build(user_id=user.id)
    attempt = AttemptFactory.build(user_id=user.id, exercise_instance_id=exercise.id)

    return {"user": user, "exercise": exercise, "attempt": attempt}
