from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
cors = CORS()
jwt = JWTManager()

token_blacklist = set()

def init_extensions(app):
    db.init_app(app)
    cors.init_app(
        app, 
        origins=app.config['CORS_ORIGINS'],
        supports_credentials=True,
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    )

    jwt.init_app(app)

    # @jwt.token_in_blocklist_loader
    # def check_if_token_revoked(jwt_header, jwt_payload):
    #     jti = jwt_payload['jti']
    #     return jti in token_blacklist

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {
            'error': 'Token wygasł',
            'message': 'Zaloguj się ponownie'
        }, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {
            'error': 'Nieprawidłowy token',
            'message': str(error)
        }, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {
            'error': 'Brak tokena',
            'message': 'Zaloguj się aby uzyskać dostęp'
        }, 401
    
    # @jwt.revoked_token_loader
    # def revoked_token_callback(jwt_header, jwt_payload):
    #     return {
    #         'error': 'Token został unieważniony',
    #         'message': 'Zaloguj się ponownie'
    #     }, 401

    with app.app_context():
        db.create_all()