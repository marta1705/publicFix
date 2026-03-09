import os
from pathlib import Path
from datetime import timedelta

class Config:
    BASE_DIR = Path(__file__).parent

    SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    SECRET_KEY = os.getenv('SECRET_KEY')

    JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['cookies']
    JWT_COOKIE_SAMESITE='Lax'

    CORS_ORIGINS = ['http://localhost:5173']
    CORS_SUPPORTS_CREDENTIALS = True

class DevelopmentConfig(Config):
    DEBUG = True
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_DOMAIN=None
    JWT_COOKIE_CSRF_PROTECT=False

class ProductionConfig(Config):
    DEBUG = False
    JWT_COOKIE_SECURE=True
    JWT_COOKIE_CSRF_PROTECT=True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}