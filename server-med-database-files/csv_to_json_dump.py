########################################################################################################################
# Alternatively, use the following command:                                                                            #
#                                                                                                                      #
# mongoimport -d datainfo -c ivis --type csv --file /home/sugandh/Downloads/data.csv --headerline                      #
#                                                                                                                      #
########################################################################################################################

import csv
import json
import pandas as pd
import sys, getopt, pprint
from pymongo import MongoClient
#CSV to JSON Conversion
csvfile = open('/home/sugandh/Downloads/data.csv', 'r')
reader = csv.DictReader( csvfile )
mongo_client=MongoClient()

#name of the database in mongodb "datainfo" and "segment" name of collection
db=mongo_client.datainfo
db.segment.drop()

#header inserted to the csv file
header= [ "Nodename", "Nodevalue"]

for each in reader:
    row={}
    for field in header:
        row[field]=each[field]

    db.segment.insert(row)