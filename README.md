# Intallation
First clone the reprository and make sure to node installed in your computer. Go into the folder and run : 

```bash
npm install
```

### To run the script
- node converter.js

### How to use the converter
Once you run the project open your browser :

- Go to  http://localhost:8080/api-docs


## To use the Email TO JSON converter

- Select POST /email and click on "Try it out"
- Select the email file you want to converter in your computer
- Execute and see the results.


## To use the CSV to CEF

- Select POST /csv and click on "Try it out"
- Select the csv file you want to converter in your computer
- Execute and see the results.

## Remove the stix

- Select POST /stix and click on "Try it out"
- Select the JSON file you want to converter in your computer
- It can be either the conversion of an email or a csv.
- Execute and see the results.

### Results


Two type of responses can be sent :

- '200' : The file has been converted
- '404' : The file doesnt exist in the Resources directory
- '500' : An error has occured
