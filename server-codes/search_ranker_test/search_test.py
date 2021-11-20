import math
import sys
import time
import metapy
import pytoml


def load_ranker(cfg_file):
    """
    Use this function to return the Ranker object to evaluate, 
    The parameter to this function, cfg_file, is the path to a
    configuration file used to load the index.
    """
    return metapy.index.OkapiBM25()

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: {} config.toml title_of_the_paper".format(sys.argv[0]))
        sys.exit(1)

    cfg = sys.argv[1]
    line = sys.argv[2]
    rank_file = sys.argv[3]
    print('Building or loading index...')
    idx = metapy.index.make_inverted_index(cfg)
    ranker = load_ranker(cfg)

    with open(cfg, 'r') as fin:
        cfg_d = pytoml.load(fin)


    start_time = time.time()
    top_k = 10

    query_start = 0

    query = metapy.index.Document()


    print('Running queries')


    query.content(line.strip())
    results = ranker.score(idx, query, top_k)
    res_num = 1
    for doc in results:
        docno = doc[0]
        print("{}\t{}\t{}\n".format( docno,
            res_num, doc[1]))
        res_num += 1
            
    for num, (d_id, _) in enumerate(results):
        content = idx.metadata(d_id).get('content')
        print("{}. {}...\n".format(d_id, content[0:250]))

    with open(rank_file, "w") as ff:
        rank_idx = []
        for doc in results:
            rank_idx.append(str(doc[0]))
        ff.write(" ".join(rank_idx))

    print("Elapsed: {} seconds".format(round(time.time() - start_time, 4)))