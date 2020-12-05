import sys
import os
from flask import Flask, request 
from gevent.pywsgi import WSGIServer
import json 

print("STARTING FLASK!!!!!!!!!!!!!")
 
app = Flask(__name__) 
PORT = int(os.environ.get("PORT", 8080))
 
@app.route("/api/v1/flask", methods = ["POST"]) 
def postdata(): 
    data = request.get_json() 
    return json.dumps(data) 
 
if __name__ == "__main__": 
    http_server = WSGIServer(('', PORT), app)
    http_server.serve_forever()