from pymongo import MongoClient

# connect to the MongoDB on MongoLab
# to learn more about MongoLab visit http://www.mongolab.com
# replace the "" in the line below with your MongoLab connection string
# you can also use a local MongoDB instance
connection = MongoClient("mongodb://localhost:27017/")

# connect to the students database and the ctec121 collection
db = connection.datainfo.ivis

# create a dictionary to hold student documents

# create dictionary
med_record = {}

# find all documents
results = db.find()

print()
print('+-+-+-+-+-+-+-+-+-+-+-+-+-+-')

node_dict = {}
# display documents from collection
for record in results:
# print out the document
    #print(str(record['Nodename']) + ',', str(record['Nodevalue']))
    node_dict[str(record['Nodevalue'])] = str(record['Nodename'])
#print(node_dict)
#print(node_dict.keys())
#print(node_dict['L01.143.506.423.906.539'])

# close the connection to MongoDB
connection.close()

for k,v in node_dict.iteritems():
    if v == "Neoplasms":
        print(k)