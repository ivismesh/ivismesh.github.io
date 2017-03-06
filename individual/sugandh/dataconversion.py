import csv
import re
import collections

with open('data.csv') as csvfile:
    nodename_to_nodeval_map = {}
    reader = csv.DictReader(csvfile)
    for row in reader:
       nodename_to_nodeval_map[row['address']] = row['name']

# print(nodename_to_nodeval_map)
hierarchy_hash = {}

# max level = ['B01.050.150.900.649.801.400.112.199.120.610.150']

#patt = re.compile('+.*', re.IGNORECASE)
for key, val in nodename_to_nodeval_map.items():
    print(val)
    hierarchy_string = "root"
    hierarchy_code = ""
    key_terms = []
    key_terms = key.split('.')
    index_key_terms = 0
    while index_key_terms < len(key_terms):
        if hierarchy_code != "":
            hierarchy_code = hierarchy_code + "." + key_terms[index_key_terms]
        else:
            hierarchy_code = key_terms[index_key_terms]
        # print(hierarchy_code)
        if hierarchy_string != "":
            hierarchy_string = hierarchy_string + "." + nodename_to_nodeval_map.get(hierarchy_code)
        else:
            hierarchy_string = nodename_to_nodeval_map.get(hierarchy_code)
        # print(hierarchy_string)
        index_key_terms = index_key_terms + 1
    print(hierarchy_code, hierarchy_string)

    hierarchy_hash[hierarchy_string] = hierarchy_code

# print(hierarchy_hash)

sorted_hashmap = collections.OrderedDict(sorted(hierarchy_hash.items()))
print(sorted_hashmap)

with open('newdata.csv', 'w') as csvfile:
    fieldnames = ['nodename', 'nodecode']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for key, val in sorted_hashmap.items():
        writer.writerow({'nodename': key, 'nodecode': val})
