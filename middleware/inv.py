import requests

url = "https://8ero1id641.execute-api.ap-south-1.amazonaws.com/v1/jsonfileupload"

datadict = {

 "id" : "5645654645y65",
 "body-json" : {
  "name": "max",
  "id": 2453243554,
  "place" : "NewYork"
 }
}

APIGatewayKey = "0GhoU6QdHP8asEkYZbn9XoVmHb9BSrn9fd0VvZn1"
headers = {
  'Content-Type': 'application/json',
  'x-api-key': APIGatewayKey
}

response = requests.request("POST", url, headers=headers, json=datadict)

print(response.text)