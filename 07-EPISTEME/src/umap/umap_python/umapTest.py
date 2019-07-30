# ~ from sklearn.datasets import load_iris
# ~ iris = load_iris().data
import umap
reducer=umap.UMAP(n_neighbors=20, n_components=2, metric='euclidean', n_epochs=500, learning_rate=1.0, init='spectral', min_dist=0.1, spread=1.0, set_op_mix_ratio=0.1, local_connectivity=1.0, repulsion_strength=1.0, negative_sample_rate=5, transform_queue_size=4.0, a=None, b=None, random_state=None, metric_kwds=None, angular_rp_forest=False, target_n_neighbors=-1, target_metric='categorical', target_metric_kwds=None, target_weight=0.5, transform_seed=42, verbose=False)
# ~ reducer.fit_transform(iris)

import numpy as np
w=[]
with open("test.tsv") as f:
    next(f)
    for line in f:
        w.append([float(x) for x in line.rstrip().split('\t')])
reducer.fit_transform(np.array(w).T)
