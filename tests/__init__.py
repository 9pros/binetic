"""
Tests Module - Non-intrusive Testing Framework

Provides testing and verification separate from production code.
"""

from .framework import (
    TestRunner,
    TestSuite,
    TestResult,
    TestStatus,
    TestCategory,
    Assertions,
    test,
    suite,
    get_test_runner,
)

__all__ = [
    "TestRunner",
    "TestSuite",
    "TestResult",
    "TestStatus",
    "TestCategory",
    "Assertions",
    "test",
    "suite",
    "get_test_runner",
]
