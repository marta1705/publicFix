from flask import Flask
import os
from .routes import register_blueprints
from .extensions import init_extensions
from .config import config


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    init_extensions(app)
    register_blueprints(app)

    @app.route('/')
    def index():
        return {
            'message': 'PublicFix API',
            'status': 'running',
        }
    return app
    