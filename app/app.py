# -*- coding:utf-8 -*-

import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

PATH = os.path.dirname(os.path.abspath(__file__))

TEMPLATES = os.path.join(PATH, 'templates')
STATICS = os.path.join(PATH, 'statics')

app = Flask("Test annotation",
            template_folder=TEMPLATES,
            static_folder=STATICS)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////' + os.path.join(PATH, 'db/annotator.db')
db = SQLAlchemy(app)

from .views import index






