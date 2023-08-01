import sys

sys.path.append('.')

from client import *
from domains import *


def _arg_or(arg_index, fallback, _type=int):
    return _type(sys.argv[arg_index]) if len(sys.argv) > arg_index else fallback


client_id = int(sys.argv[1])
in_file = sys.argv[2]
player_hosts = [host.split(':')[0] for host in sys.argv[3].split(',') if host]

data_size = _arg_or(4, 4)

num_bins = _arg_or(5, 10)
bin_size = _arg_or(6, 2)

client = Client(player_hosts, 14000, client_id)

type = client.specification.get_int(4)

if type == ord('R'):
    domain = Z2(client.specification.get_int(4))
elif type == ord('p'):
    domain = Fp(client.specification.get_bigint())
else:
    raise Exception('invalid type')


def data_to_histogram(data):
    hist = [0] * num_bins
    d_min = 0

    for i in range(data_size):
        d = data[i]
        index = (d - d_min) // bin_size
        if index >= num_bins:
            index = num_bins - 1
        if d < d_min:
            index = 0
        hist[index] += 1

    return hist


with open(in_file, 'r') as fd:
    f_enough = False
    count = 0
    data_list = []
    while not f_enough:
        line = fd.readline().strip()
        for seg in line.split():
            data = int(seg)
            data_list.append(data)
            count += 1
            if count == data_size:
                f_enough = True
                break

    hist = data_to_histogram(data_list)

    # client.send_private_inputs([domain(data) for data in data_list])
    client.send_private_inputs([domain(h) for h in hist])

    result = [res.v % 2 ** 64 / 2 ** 16 for res in client.receive_outputs(domain, num_bins)]

    print(result)
