# -*- coding:utf-8 -*-

from app.app import app
from app.models.schema import populate_database


if __name__ == '__main__':
    populate_database()
    app.run(debug=True)
