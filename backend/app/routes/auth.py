from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies
)
import re
from ..extensions import db, token_blacklist
from ..models.user import User
from werkzeug.security import generate_password_hash, check_password_hash

auth = Blueprint('auth', __name__, url_prefix='/api/auth')

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password):
    if len(password) < 8:
        return False, "Hasło musi mieć minimum 8 znaków"
    if not re.search(r'[A-Z]', password):
        return False, "Hasło musi zawierać wielką literę"
    if not re.search(r'[a-z]', password):
        return False, "Hasło musi zawierać małą literę"
    if not re.search(r'\d', password):
        return False, "Hasło musi zawierać cyfrę"
    return True, None

@auth.route('/register', methods=['POST'])
def register():
    try:
        # DEBUG: Sprawdź co przychodzi
        print("=" * 50)
        print("REGISTER REQUEST")
        print("Content-Type:", request.content_type)
        print("Data:", request.data)
        print("JSON:", request.get_json())
        print("=" * 50)
        
        data = request.get_json()
        
        if not data:
            print("❌ Brak danych w request body")
            return {'error': 'Brak danych w request body'}, 400
        
        print("✅ Otrzymane dane:", data)
        required_fields = ['email', 'first_name', 'password']
        for field in required_fields:
            if field not in data:
                return {'error': f'Brakujące pole: {field}'}, 400
        
        if not validate_email(data['email']):
            return {'error': 'Nieprawidłowy format email'}, 400
        
        is_valid, error_msg = validate_password_strength(data['password'])
        if not is_valid:
            return {'error': error_msg}, 400
        
        if User.query.filter_by(email=data['email'].lower()).first():
            return {'error': 'Email już jest zajęty'}, 409
        
        # Hash hasła
        password_hash = generate_password_hash(data['password'])

        # Utwórz użytkownika
        new_user = User(
            email=data['email'].lower(),
            password_hash=password_hash, 
            first_name=data['first_name'],
            role='user'
        )

        db.session.add(new_user)
        db.session.commit()

        # Utwórz tokeny
        access_token = create_access_token(identity=str(new_user.id), additional_claims={'role': new_user.role})
        refresh_token = create_refresh_token(identity=str(new_user.id))

        # Przygotuj response
        response = jsonify({
            'message': 'Rejestracja zakończona sukcesem',
            'user': {
                'id': new_user.id,
                'email': new_user.email,
                'first_name': new_user.first_name,
                'created_at': new_user.created_at.isoformat(),
                'role': new_user.role
            }
        })

        # ✅ POPRAWKA: Ustaw OBA tokeny w cookies
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Registration error: {str(e)}')
        return {'error': 'Błąd podczas rejestracji'}, 500
    

@auth.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data:
            return {'error': 'Brak danych w request body'}, 400
        
        # Pobierz użytkownika
        user_obj = User.query.filter_by(email=data.get('email', '').lower()).first()

        # Sprawdź czy istnieje i hasło się zgadza
        if not user_obj or not user_obj.check_password(data.get('password', '')):
            return {'error': 'Nieprawidłowy email lub hasło'}, 401
        
        if not user_obj.is_active:
            return {'error': 'Konto jest nieaktywne'}, 403
        
        # Utwórz tokeny
        access_token = create_access_token(identity=str(user_obj.id), additional_claims={'role': user_obj.role})
        refresh_token = create_refresh_token(identity=str(user_obj.id))

        # Przygotuj response
        response = jsonify({
            'message': 'Zalogowano pomyślnie',
            'user': {
                'id': user_obj.id,
                'email': user_obj.email,
                'first_name': user_obj.first_name,
                'role': user_obj.role,
            }
        })

        # Ustaw cookies
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, 200
        
    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return {'error': 'Błąd podczas logowania'}, 500
               

@auth.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)

    response = jsonify({'message': 'Token odświeżony'})
    set_access_cookies(response, new_access_token)

    return response, 200


@auth.route('/logout', methods=['POST'])
def logout():
    response = jsonify({'message': 'Wylogowano pomyślnie'})
    unset_jwt_cookies(response)
    return response, 200


@auth.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    
    user = User.query.filter_by(id=int(current_user_id)).first()

    if not user:
        return jsonify({'error': 'Użytkownik nie znaleziony'}), 404
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat(),
        'role': user.role
    }), 200