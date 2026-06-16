#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Entrada alternativa para rodar a aplicação Flask localmente
"""

import sys
import os

# Garantir que o diretório base está no PYTHONPATH
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

from app import app

if __name__ == "__main__":
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_RUN_PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '1').lower() not in ('0', 'false')

    print(f"🚀 Iniciando servidor em {host}:{port}")
    app.run(host=host, port=port, debug=debug)
