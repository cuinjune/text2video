import sys
from flask import Flask, request 
import json 
 
app = Flask(__name__) 
PORT = int(sys.argv[1]) or 8080
 
@app.route("/api/v1/flask", methods = ["POST"]) 
def postdata(): 
    data = request.get_json() 
    return json.dumps(data) 
 
if __name__ == "__main__": 
	app.run(port=PORT) 