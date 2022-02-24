from app.app import app

from app.models.schema import populate_database

LOCAL = False
SERVER = True


if __name__ == '__main__':
    populate_database()
    app.run()