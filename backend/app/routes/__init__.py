from .report import report
from .auth import auth

blueprints = [report, auth]

def register_blueprints(app):
    for blueprint in blueprints:
        app.register_blueprint(blueprint)