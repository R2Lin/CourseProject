#!/bin/bash
set -e

# assuming we are under search_ranker_test folder
ID=${1}
DAT_FILE=${2}
TITLE=${3}

FOLDER=tmp_task_${ID}
CONF_CURR=tmp_config_${ID}.toml
RANK_FILE=${FOLDER}/rank

echo "Removing idx, previous configuration file ${CONF_CURR}"
rm -rf idx
rm -rf ${CONF_CURR}

echo "Removing Folder ${FOLDER}..."
rm -rf ${FOLDER}

echo "Creating Folder ${FOLDER}..."
mkdir ${FOLDER}

cp line.toml ${FOLDER}/line.toml

echo "Creating config ${CONF_CURR}"
cp config_A ${CONF_CURR}
echo "dataset = \"${FOLDER}\"" >> ${CONF_CURR}
cat config_B >> ${CONF_CURR}

cp ${DAT_FILE} ${FOLDER}/${FOLDER}.dat

echo "Running python for getting ranking file ${RANK_FILE}"
echo "Command: python3 search_test.py ${CONF_CURR} \"${TITLE}\""
python3 search_test.py ${CONF_CURR} "${TITLE}" ${RANK_FILE}