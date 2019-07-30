import numpy as np

testIn=np.array([6.04976536e-01, 6.47855451e-01, 6.61374573e-01, 5.09254960e-01,
        6.32208107e-01, 2.01824150e-02, 4.36276451e-01, 4.68361746e-01,
        2.75727420e-01, 4.57330440e-01, 4.69498690e-01, 6.70801373e-01,
        1.40980384e-01, 8.00924255e-01, 8.81465592e-02, 9.66324761e-01,
        4.85013689e-01, 1.19637408e-01, 2.68103812e-01, 7.38348643e-01,
        3.65362825e-01, 7.95747333e-01, 5.75813310e-01, 9.98612209e-01,
        2.23972697e-01, 7.81228788e-01, 4.31835438e-01, 2.10445745e-01,
        5.64849517e-01, 8.16757095e-01, 7.13023432e-01, 2.17336148e-01,
        5.36817890e-01, 7.48620080e-01, 5.78428206e-01, 8.11337200e-01,
        6.14570401e-02, 1.17263657e-01, 8.62616613e-01, 6.76545500e-01,
        1.60496519e-01, 2.01351019e-01, 7.85928152e-02, 1.28265346e-01,
        6.23321644e-01, 7.58595828e-01, 2.58523454e-01, 5.65208024e-01,
        6.16839794e-01, 5.29450340e-01, 1.41526055e-01, 9.38861219e-02,
        2.42043278e-02, 9.77053966e-01, 5.98249232e-01, 7.88556177e-01,
        9.33255845e-01, 2.06754699e-01, 3.73921265e-01, 9.73976809e-01,
        4.40036913e-01, 2.11306149e-01, 3.27357624e-01, 2.93904957e-01,
        5.52106738e-01, 4.93098479e-01, 5.11361038e-01, 3.51524687e-01,
        2.03316424e-01, 9.81785804e-01, 4.76829446e-01, 3.37300101e-01,
        9.77901545e-01, 8.16633903e-02, 7.14222726e-01, 3.38706740e-01,
        6.87617775e-01, 8.39314506e-01, 5.31120581e-01, 2.61230968e-02,
        6.28010884e-01, 2.01288489e-01, 1.54249294e-01, 7.10718897e-01,
        4.73801596e-01, 9.04542650e-01, 8.81342217e-01, 2.25191576e-01,
        1.77846311e-01, 6.13543085e-01, 7.15337766e-02, 2.60871132e-01,
        9.25880428e-01, 4.38801082e-01, 2.21272886e-02, 3.92632893e-01,
        5.38073519e-01, 4.51697992e-02, 6.33523214e-01, 5.89237829e-01,
        4.15257698e-01, 7.56686810e-01, 6.92742436e-01, 7.58004199e-01,
        3.57157916e-01, 9.40137840e-04, 4.07921665e-01, 4.34485149e-01,
        3.18728735e-01, 6.23208172e-01, 9.56089705e-01, 8.53327002e-01,
        9.58269048e-01, 6.08684520e-01, 1.62931691e-01, 2.75606093e-01,
        5.44176029e-02, 8.15287258e-01, 8.83502551e-01, 3.27169547e-01,
        7.67518852e-01, 4.62228736e-01, 7.43297588e-01, 9.77279030e-01,
        8.55196293e-01, 3.43858189e-01, 4.22396960e-01, 4.14501701e-01,
        2.24794624e-01, 5.04178910e-01, 2.78553944e-01, 6.18260628e-01,
        8.47759803e-01, 7.71598632e-01, 5.13340416e-01, 2.99294284e-02,
        6.50588302e-01, 8.32471750e-01, 2.70586266e-01, 1.96995419e-01,
        2.51512535e-01, 2.26320654e-01, 2.10601643e-01, 6.57873061e-01])
print(testIn)
def wmean(x, w):
    '''
    Weighted mean
    '''
    return sum(x * w) / float(sum(w))

def wvar(x, w):
    '''
    Weighted variance
    '''
    return sum(w * (x - wmean(x, w)) ** 2) / float(sum(w) - 1)



class normal(object):
    '''
    The 1D normal (or Gaussian) distribution.
    '''

    @staticmethod
    def pdf(x, mu, sigma):
        return np.exp(normal.logpdf(x, mu, sigma))

    @staticmethod
    def logpdf(x, mu, sigma):
        return -0.5 * np.log(2.0 * np.pi) - np.log(sigma) - \
            0.5 * ((x - mu) ** 2) / (sigma ** 2)

    @staticmethod
    def rvs(mu, sigma, N=1):
        return np.random.normal(mu, sigma, N)

def dnorm(x):
    return normal.pdf(x, 0.0, 1.0)


def hnorm(x, weights=None):
    '''
    Bandwidth estimate assuming f is normal. See paragraph 2.4.2 of
    Bowman and Azzalini[1]_ for details.
    References
    ----------
    .. [1] Applied Smoothing Techniques for Data Analysis: the
        Kernel Approach with S-Plus Illustrations.
        Bowman, A.W. and Azzalini, A. (1997).
        Oxford University Press, Oxford
    '''

    x = np.asarray(x)

    if weights is None:
        weights = np.ones(len(x))

    n = float(sum(weights))

    if len(x.shape) == 1:
        sd = np.sqrt(wvar(x, weights))
        return sd * (4 / (3 * n)) ** (1 / 5.0)

    # TODO: make this work for more dimensions
    # ((4 / (p + 2) * n)^(1 / (p+4)) * sigma_i
    if len(x.shape) == 2:
        ndim = x.shape[1]
        sd = np.sqrt(np.apply_along_axis(wvar, 1, x, weights))
        return (4.0 / ((ndim + 2.0) * n) ** (1.0 / (ndim + 4.0))) * sd

def hsj(x, weights=None):
    '''
    Sheather-Jones bandwidth estimator [1]_.
    References
    ----------
    .. [1] A reliable data-based bandwidth selection method for kernel
        density estimation. Simon J. Sheather and Michael C. Jones.
        Journal of the Royal Statistical Society, Series B. 1991
    '''

    h0 = hnorm(x)
    v0 = sj(x, h0)

    if v0 > 0:
        hstep = 1.1
    else:
        hstep = 0.9

    h1 = h0 * hstep
    v1 = sj(x, h1)
    print(v1)
    print(v0)
    while v1 * v0 > 0:
        h0 = h1
        v0 = v1
        h1 = h0 * hstep
        v1 = sj(x, h1)
    return h0 + (h1 - h0) * abs(v0) / (abs(v0) + abs(v1))

def sj(x, h):
    '''
    Equation 12 of Sheather and Jones [1]_
    References
    ----------
    .. [1] A reliable data-based bandwidth selection method for kernel
        density estimation. Simon J. Sheather and Michael C. Jones.
        Journal of the Royal Statistical Society, Series B. 1991
    '''
    phi6 = lambda x: (x ** 6 - 15 * x ** 4 + 45 * x ** 2 - 15) * dnorm(x)
    phi4 = lambda x: (x ** 4 - 6 * x ** 2 + 3) * dnorm(x)

    n = len(x)
    one = np.ones((1, n))

    lam = np.percentile(x, 75) - np.percentile(x, 25)
    a = 0.92 * lam * n ** (-1 / 7.0)
    b = 0.912 * lam * n ** (-1 / 9.0)

    W = np.tile(x, (n, 1))
    W = W - W.T

    W1 = phi6(W / b)
    tdb = np.dot(np.dot(one, W1), one.T)
    tdb = -tdb / (n * (n - 1) * b ** 7)

    W1 = phi4(W / a)
    sda = np.dot(np.dot(one, W1), one.T)
    sda = sda / (n * (n - 1) * a ** 5)

    alpha2 = 1.357 * (abs(sda / tdb)) ** (1 / 7.0) * h ** (5 / 7.0)

    W1 = phi4(W / alpha2)
    sdalpha2 = np.dot(np.dot(one, W1), one.T)
    sdalpha2 = sdalpha2 / (n * (n - 1) * alpha2 ** 5)

    return (normal.pdf(0, 0, np.sqrt(2)) /(n * abs(sdalpha2[0, 0]))) ** 0.2 - h

print(hsj(testIn))
