import sys
import os
from flask import Flask, request 
from gevent.pywsgi import WSGIServer
import json 


app = Flask(__name__) 
PORT = int(os.environ.get("PORT", 8080) + 1)

print("STARTING FLASK!!!!!!!!!!!!! FROM: ", PORT)
 
@app.route("/api/v1/flask", methods = ["POST"]) 
def postdata(): 
    data = request.get_json() 
    return json.dumps(data) 
 
if __name__ == "__main__": 
    http_server = WSGIServer(('', PORT), app)
    http_server.serve_forever()