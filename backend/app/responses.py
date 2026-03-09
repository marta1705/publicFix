from flask import jsonify


def success_response(data=None, message=None, status=200):
    response = {
        "data": data
    }

    if message:
        response["message"] = message

    return jsonify(response), status


def error_response(code, message, status=400, field=None):
    error = {
        "code": code,
        "message": message
    }

    if field:
        error["field"] = field

    return jsonify({"error": error}), status


# przykład użycia:
# from app.utils.responses import success_response, error_response

# @bp.route("/user/<int:id>")
# def get_user(id):
#     user = User.query.get(id)

#     if not user:
#         return error_response(
#             "USER_NOT_FOUND",
#             "User not found",
#             404
#         )

#     return success_response(user.to_dict())


