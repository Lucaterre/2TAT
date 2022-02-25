# -*- coding:utf-8 -*-
import json


def open_text(filename):
    with open(filename, mode='r', encoding="utf-8") as f:
        file = f.read()
    return file


def open_json(filename):
    with open(filename) as json_file:
        data = json.load(json_file)
    return data
