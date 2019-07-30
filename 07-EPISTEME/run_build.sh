targetServerLocation=${1}

npm install --save-devel

rm -rf ${targetServerLocation}/*
mkdir ${targetServerLocation}/php
npm run build 
cp -R dist/* ${targetServerLocation}
cp php/* ${targetServerLocation}/php/
cp src/metadata/excel-bootstrap-table-filter-bundle.js ${targetServerLocation}
cp src/metadata/excel-bootstrap-table-filter-style.css ${targetServerLocation}
cp resources/* ${targetServerLocation}
chmod 777 ${targetServerLocation}/DKFZ_Logo-Research_en_Black-Blue_CMYK.eps.png
