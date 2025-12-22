"""
Testing Framework - Non-intrusive Verification System

Provides testing and verification without cluttering production code.
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set
from enum import Enum
import time
import asyncio
import logging
import traceback

logger = logging.getLogger(__name__)


class TestStatus(Enum):
    """Test execution status"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class TestCategory(Enum):
    """Categories of tests"""
    UNIT = "unit"
    INTEGRATION = "integration"
    SECURITY = "security"
    PERFORMANCE = "performance"
    E2E = "e2e"


@dataclass
class TestResult:
    """Result of a single test"""
    test_name: str
    status: TestStatus
    
    # Timing
    started_at: float = 0.0
    finished_at: float = 0.0
    duration_ms: float = 0.0
    
    # Details
    message: str = ""
    error: Optional[str] = None
    traceback: Optional[str] = None
    
    # Assertions
    assertions_passed: int = 0
    assertions_failed: int = 0
    
    def to_dict(self) -> Dict:
        return {
            "test_name": self.test_name,
            "status": self.status.value,
            "duration_ms": self.duration_ms,
            "message": self.message,
            "error": self.error,
            "assertions": {
                "passed": self.assertions_passed,
                "failed": self.assertions_failed,
            },
        }


@dataclass
class TestSuite:
    """Collection of related tests"""
    name: str
    category: TestCategory
    tests: List[Callable] = field(default_factory=list)
    results: List[TestResult] = field(default_factory=list)
    
    # Hooks
    before_all: Optional[Callable] = None
    after_all: Optional[Callable] = None
    before_each: Optional[Callable] = None
    after_each: Optional[Callable] = None


class AssertionError(Exception):
    """Custom assertion error with context"""
    def __init__(self, message: str, expected: Any = None, actual: Any = None):
        self.message = message
        self.expected = expected
        self.actual = actual
        super().__init__(message)


class Assertions:
    """Assertion helpers for tests"""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
    
    def _record(self, passed: bool):
        if passed:
            self.passed += 1
        else:
            self.failed += 1
    
    def equal(self, actual: Any, expected: Any, message: str = ""):
        """Assert values are equal"""
        passed = actual == expected
        self._record(passed)
        if not passed:
            raise AssertionError(
                message or f"Expected {expected}, got {actual}",
                expected=expected,
                actual=actual,
            )
    
    def not_equal(self, actual: Any, not_expected: Any, message: str = ""):
        """Assert values are not equal"""
        passed = actual != not_expected
        self._record(passed)
        if not passed:
            raise AssertionError(
                message or f"Expected not {not_expected}, got {actual}",
                expected=f"not {not_expected}",
                actual=actual,
            )
    
    def true(self, value: bool, message: str = ""):
        """Assert value is truthy"""
        passed = bool(value)
        self._record(passed)
        if not passed:
            raise AssertionError(message or f"Expected truthy, got {value}")
    
    def false(self, value: bool, message: str = ""):
        """Assert value is falsy"""
        passed = not bool(value)
        self._record(passed)
        if not passed:
            raise AssertionError(message or f"Expected falsy, got {value}")
    
    def none(self, value: Any, message: str = ""):
        """Assert value is None"""
        passed = value is None
        self._record(passed)
        if not passed:
            raise AssertionError(message or f"Expected None, got {value}")
    
    def not_none(self, value: Any, message: str = ""):
        """Assert value is not None"""
        passed = value is not None
        self._record(passed)
        if not passed:
            raise AssertionError(message or "Expected not None")
    
    def contains(self, container: Any, item: Any, message: str = ""):
        """Assert container contains item"""
        passed = item in container
        self._record(passed)
        if not passed:
            raise AssertionError(message or f"Expected {container} to contain {item}")
    
    def instance_of(self, obj: Any, cls: type, message: str = ""):
        """Assert object is instance of class"""
        passed = isinstance(obj, cls)
        self._record(passed)
        if not passed:
            raise AssertionError(
                message or f"Expected instance of {cls.__name__}, got {type(obj).__name__}"
            )
    
    def raises(self, func: Callable, exception_type: type = Exception, message: str = ""):
        """Assert function raises exception"""
        try:
            func()
            self._record(False)
            raise AssertionError(message or f"Expected {exception_type.__name__} to be raised")
        except exception_type:
            self._record(True)
        except Exception as e:
            self._record(False)
            raise AssertionError(
                message or f"Expected {exception_type.__name__}, got {type(e).__name__}"
            )
    
    async def async_raises(self, coro, exception_type: type = Exception, message: str = ""):
        """Assert async function raises exception"""
        try:
            await coro
            self._record(False)
            raise AssertionError(message or f"Expected {exception_type.__name__} to be raised")
        except exception_type:
            self._record(True)
        except Exception as e:
            self._record(False)
            raise AssertionError(
                message or f"Expected {exception_type.__name__}, got {type(e).__name__}"
            )


class TestRunner:
    """
    Test runner for executing test suites.
    
    Designed to be non-intrusive - tests are completely separate from production code.
    """
    
    def __init__(self):
        self._suites: Dict[str, TestSuite] = {}
        self._results: List[TestResult] = []
        self._hooks: Dict[str, List[Callable]] = {
            "before_run": [],
            "after_run": [],
            "on_pass": [],
            "on_fail": [],
        }
    
    def suite(
        self,
        name: str,
        category: TestCategory = TestCategory.UNIT,
    ) -> TestSuite:
        """Create or get a test suite"""
        if name not in self._suites:
            self._suites[name] = TestSuite(name=name, category=category)
        return self._suites[name]
    
    def test(
        self,
        suite_name: str,
        test_name: Optional[str] = None,
    ):
        """Decorator to register a test"""
        def decorator(func: Callable):
            suite = self.suite(suite_name)
            func._test_name = test_name or func.__name__
            suite.tests.append(func)
            return func
        return decorator
    
    def hook(self, event: str):
        """Decorator to register a hook"""
        def decorator(func: Callable):
            if event in self._hooks:
                self._hooks[event].append(func)
            return func
        return decorator
    
    async def run_all(
        self,
        categories: Optional[List[TestCategory]] = None,
        pattern: Optional[str] = None,
    ) -> Dict:
        """Run all tests"""
        self._results = []
        
        # Fire before hooks
        for hook in self._hooks["before_run"]:
            await self._call_hook(hook)
        
        # Filter suites
        suites = list(self._suites.values())
        if categories:
            suites = [s for s in suites if s.category in categories]
        
        # Run suites
        for suite in suites:
            await self._run_suite(suite, pattern)
        
        # Fire after hooks
        for hook in self._hooks["after_run"]:
            await self._call_hook(hook)
        
        return self._generate_report()
    
    async def run_suite(self, suite_name: str) -> Dict:
        """Run a specific suite"""
        if suite_name not in self._suites:
            return {"error": f"Suite '{suite_name}' not found"}
        
        suite = self._suites[suite_name]
        await self._run_suite(suite)
        return self._generate_report()
    
    async def _run_suite(self, suite: TestSuite, pattern: Optional[str] = None):
        """Execute a test suite"""
        logger.info(f"Running suite: {suite.name}")
        
        # Before all
        if suite.before_all:
            await self._call_hook(suite.before_all)
        
        # Run tests
        tests = suite.tests
        if pattern:
            tests = [t for t in tests if pattern.lower() in t._test_name.lower()]
        
        for test_func in tests:
            result = await self._run_test(test_func, suite)
            suite.results.append(result)
            self._results.append(result)
        
        # After all
        if suite.after_all:
            await self._call_hook(suite.after_all)
    
    async def _run_test(self, test_func: Callable, suite: TestSuite) -> TestResult:
        """Execute a single test"""
        test_name = getattr(test_func, "_test_name", test_func.__name__)
        assertions = Assertions()
        
        result = TestResult(
            test_name=f"{suite.name}::{test_name}",
            status=TestStatus.RUNNING,
            started_at=time.time(),
        )
        
        try:
            # Before each
            if suite.before_each:
                await self._call_hook(suite.before_each)
            
            # Run test
            if asyncio.iscoroutinefunction(test_func):
                await test_func(assertions)
            else:
                test_func(assertions)
            
            # After each
            if suite.after_each:
                await self._call_hook(suite.after_each)
            
            # Success
            result.status = TestStatus.PASSED
            result.assertions_passed = assertions.passed
            result.assertions_failed = assertions.failed
            
            # Fire pass hooks
            for hook in self._hooks["on_pass"]:
                await self._call_hook(hook, result)
            
        except AssertionError as e:
            result.status = TestStatus.FAILED
            result.error = str(e)
            result.message = e.message
            result.assertions_passed = assertions.passed
            result.assertions_failed = assertions.failed + 1
            
            # Fire fail hooks
            for hook in self._hooks["on_fail"]:
                await self._call_hook(hook, result)
            
        except Exception as e:
            result.status = TestStatus.ERROR
            result.error = str(e)
            result.traceback = traceback.format_exc()
            
            # Fire fail hooks
            for hook in self._hooks["on_fail"]:
                await self._call_hook(hook, result)
        
        result.finished_at = time.time()
        result.duration_ms = (result.finished_at - result.started_at) * 1000
        
        status_icon = "✓" if result.status == TestStatus.PASSED else "✗"
        logger.info(f"  {status_icon} {test_name} ({result.duration_ms:.2f}ms)")
        
        return result
    
    async def _call_hook(self, hook: Callable, *args):
        """Call a hook function"""
        try:
            if asyncio.iscoroutinefunction(hook):
                await hook(*args)
            else:
                hook(*args)
        except Exception as e:
            logger.error(f"Hook error: {e}")
    
    def _generate_report(self) -> Dict:
        """Generate test report"""
        passed = len([r for r in self._results if r.status == TestStatus.PASSED])
        failed = len([r for r in self._results if r.status == TestStatus.FAILED])
        errors = len([r for r in self._results if r.status == TestStatus.ERROR])
        skipped = len([r for r in self._results if r.status == TestStatus.SKIPPED])
        total = len(self._results)
        
        return {
            "summary": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "errors": errors,
                "skipped": skipped,
                "pass_rate": passed / total if total > 0 else 0,
            },
            "suites": {
                name: {
                    "category": suite.category.value,
                    "total": len(suite.results),
                    "passed": len([r for r in suite.results if r.status == TestStatus.PASSED]),
                    "failed": len([r for r in suite.results if r.status == TestStatus.FAILED]),
                }
                for name, suite in self._suites.items()
            },
            "results": [r.to_dict() for r in self._results],
            "failures": [
                r.to_dict() for r in self._results
                if r.status in (TestStatus.FAILED, TestStatus.ERROR)
            ],
        }


# Global test runner
_runner: Optional[TestRunner] = None


def get_test_runner() -> TestRunner:
    """Get or create global test runner"""
    global _runner
    if _runner is None:
        _runner = TestRunner()
    return _runner


# Convenience decorators
def test(suite_name: str, test_name: Optional[str] = None):
    """Register a test function"""
    return get_test_runner().test(suite_name, test_name)


def suite(name: str, category: TestCategory = TestCategory.UNIT) -> TestSuite:
    """Get or create a test suite"""
    return get_test_runner().suite(name, category)


# Prevent pytest from collecting these as tests
test.__test__ = False  # type: ignore[attr-defined]
suite.__test__ = False  # type: ignore[attr-defined]

# Also prevent pytest from trying to treat framework types as tests
TestStatus.__test__ = False  # type: ignore[attr-defined]
TestCategory.__test__ = False  # type: ignore[attr-defined]
TestResult.__test__ = False  # type: ignore[attr-defined]
TestSuite.__test__ = False  # type: ignore[attr-defined]
