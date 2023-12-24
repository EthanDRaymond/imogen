set -e

NODE_VERSIONS=("20" "20.10" "20.10.0")
NODE_IMAGE_SUFFIXES=('alpine' 'alpine3.17' 'alpine3.18' 'alpine3.19' 'bookworm' 'bookworm-slim' 'bullseye' 'bullseye-slim' 'buster' 'buster-slim' 'slim');
IMOGEN_VERSIONS=('0.3.0')

for imogen_version in ${IMOGEN_VERSIONS[@]}; do
    for node_version in ${NODE_VERSIONS[@]}; do
        for node_image_suffix in ${NODE_IMAGE_SUFFIXES[@]}; do
            # Create Dockerfile
            echo "FROM node:$node_version-$node_image_suffix" > Dockerfile
            echo "RUN npm install -g pino-pretty" >> Dockerfile
            echo "RUN npm install -g @lanternfly/imogen@$imogen_version" >> Dockerfile
            echo "CMD imogen run --config=/imogen/imogen.config.json | pino-pretty" >> Dockerfile

            # Build Docker Image
            IMAGE="lanternfly/imogen:$imogen_version-node$node_version-$node_image_suffix"
            docker build -t $IMAGE .
        done
    done
done