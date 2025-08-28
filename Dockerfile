FROM mcr.microsoft.com/playwright:v1.55.0-jammy   
WORKDIR /
# prevent tzdata from prompting
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

# X stack for headed/VNC runs (non-interactive)
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC
RUN apt-get update && apt-get install -y --no-install-recommends tzdata xvfb x11vnc fluxbox \
 && ln -fs /usr/share/zoneinfo/$TZ /etc/localtime \
 && dpkg-reconfigure -f noninteractive tzdata \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# copy everything; rely on .dockerignore
COPY . .

ENV EXT_DIR=/extensions
ENV USER_DATA_DIR=/user-data
ENV CI=true
ENV NODE_ENV=production

# sanity check: prove script exists at build time (remove later)
RUN ls -la src/scripts && test -f src/scripts/run-tests.sh

# make sure unix + executable (only after the check above)
RUN apt-get update && apt-get install -y dos2unix && \
    dos2unix src/scripts/run-tests.sh && chmod +x src/scripts/run-tests.sh

ENTRYPOINT ["bash", "src/scripts/run-tests.sh"]
CMD ["--reporter=line"]
