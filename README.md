# Intallation
First clone the reprository and make sure to node installed in your computer. Go into the folder and run : 

```bash
npm install
```

###To run the script
- node converter.js

### How to use the converter
Once you run the project open your browser :

- Go to  http://localhost:8080/api-docs


## To use the Email TO JSON converter

- Put your email in the Resources/Email folder, in the .txt format.

- Select GET /email/{emailfile} and click on "Try it out"
- Enter your email's filename as a parameter but don't add the '.txt' extension !
- Execute and see the results.


## To use the CSV to CEF

- Select GET /csv/{csvfile} and click on "Try it out"
- Enter either : 'fileNameConnectionDetected' or 'fileNameDomainGeneration'
- Execute and see the results.

### Results


Two type of responses can be sent :

- '200' : The email has been converted
- '404' : The email doesnt exist in the Email directory
