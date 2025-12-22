import pytest

from tests.framework import Assertions


@pytest.fixture
def assert_() -> Assertions:
    return Assertions()
