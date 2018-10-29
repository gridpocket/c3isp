# Intallation
First clone the reprository and make sure to node installed on your machine. Go into the c3isp folder and run the following command to install all the dependencies required: 

```bash
npm install
```

### The script is using the port 9443. So make sure there is not another application using this port and run:
- node converter.js

### How to use the converter
Once the project is run, open your browser :

- Go to  https://isic3isp.iit.cnr.it:9443/format-adapter/api-docs/


## To use the converter

- Select POST /convert and click on "Try it out"
- Select the file you want to convert : EML or CSV (examples can be found in the Resources folder)
- Execute and see the results in the responses.
- If it receives a data already in STIX, it return the same data without doing any change

### Request URL :

```bash
https://isic3isp.iit.cnr.it:9443/format-adapter/api/v1/convert
```

### Example of CURL : 

```bash
curl -X POST "https://isic3isp.iit.cnr.it:9443/format-adapter/api/v1/convert" -H  "accept: application/json" -H  "Content-Type: multipart/form-data" -F "file=@name_of_the_file_your_want_to_convert.extension;type=application/json"
```


## Remove the stix

- Select POST /convertDL and click on "Try it out"
- Select the JSON file you want to convert (examples can be found in Resources/Stix folder)
- It can be either the conversion of an email or a csv.
- Execute and see the results.


### Request URL :

```bash
https://isic3isp.iit.cnr.it:9443/format-adapter/api/v1/convertDL
```

### Example of CURL : 

```bash
curl -X POST "https://isic3isp.iit.cnr.it:9443/format-adapter/api/v1/convertDL" -H  "accept: text/plain" -H  "Content-Type: multipart/form-data" -F "file=@name_of_the_file_your_want_to_un_stix.extension;type=application/json"
```
