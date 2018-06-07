# Intallation
First clone the reprository and make sure to node installed on your machine. Go into the c3isp folder and run the following command to install all the dependencies required: 

```bash
npm install
```

### The script is using the port 8080. So make sure there is not another application using this port and run:
- node converter.js

### How to use the converter
Once the project is run, open your browser :

- Go to  http://localhost:8080/api-docs


## To use the Email TO JSON converter

- Select POST /email and click on "Try it out"
- Select the email file you want to convert (examples can be found Resources/Email)
- Execute and see the results.


## To use the CSV to CEF

- Select POST /csv and click on "Try it out"
- Select the csv file you want to convert (examples can be found Resources/CSV)
- Execute and see the results.

## Remove the stix

- Select POST /stix and click on "Try it out"
- Select the JSON file you want to convert (examples can be found Resources/Stix)
- It can be either the conversion of an email or a csv.
- Execute and see the results.

### Results


Three type of responses can be sent :

- '200' : The file has been converted
- '404' : The file doesnt exist in the Resources directory
- '500' : An error has occured
