FROM nikolaik/python-nodejs:python3.7-nodejs12

WORKDIR /usr/src/app
COPY requirements.txt ./

RUN pip install -r requirements.txt

COPY package*.json ./

RUN npm cache clean --force && npm install

COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]