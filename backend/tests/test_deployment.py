import pytest
from app import auth


def test_production_requires_secret(monkeypatch, tmp_path):
    monkeypatch.setenv('APP_ENV', 'production')
    monkeypatch.delenv('OWNER_PASSWORD', raising=False)
    monkeypatch.setattr(auth, 'PASSWORD_PATH', tmp_path / 'secret.txt')
    with pytest.raises(RuntimeError):
        auth.initialize_password()
    assert not auth.PASSWORD_PATH.exists()


def test_environment_secret_never_written_to_disk(monkeypatch, tmp_path):
    monkeypatch.setenv('OWNER_PASSWORD', 'test-only-long-secret-for-deployment')
    monkeypatch.setattr(auth, 'PASSWORD_PATH', tmp_path / 'secret.txt')
    auth.initialize_password()
    assert not auth.PASSWORD_PATH.exists()
    monkeypatch.setenv('OWNER_PASSWORD', 'short')
    with pytest.raises(RuntimeError):
        auth.initialize_password()
