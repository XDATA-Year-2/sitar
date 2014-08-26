import getpass
import sys

import GirderClient

def main():
    try:
        user = sys.argv[1]
    except IndexError:
        print >>sys.stderr, "usage: boostrap.py <username>"
        return 1

    password = getpass.getpass("Password for %s: " % (user))

    c = GirderClient.GirderClient("localhost", 8080)

    try:
        c.authenticate(user, password)
    except GirderClient.AuthenticationError:
        print >>sys.stderr, "error: could not authenticate"
        return 1

    visfolder = "53ebca58dd28a83e66b61fb6"

    item = c.createItem(visfolder, "Medals by Per Capita GDP", "A scatterplot showing the relationship between medals won and per capita GDP")
    c.uploadFileToItem(item, "poster.png")
    c.uploadFileToItem(item, "vega.json")
    

if __name__ == "__main__":
    sys.exit(main())
