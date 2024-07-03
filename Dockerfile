# Use a imagem base do Node.js
FROM node:18

# Crie um diretório de trabalho no contêiner
WORKDIR /app

# Copie o package.json e o package-lock.json para o diretório de trabalho
COPY package.json yarn.lock ./

# Instale as dependências
RUN yarn install --frozen-lockfile --production

# Copie o código fonte para o diretório de trabalho
COPY . .

# Exponha a porta que o servidor WebSocket está ouvindo (defina a mesma porta que você usa localmente)
EXPOSE 5000

# Inicie o servidor quando o contêiner for iniciado
CMD [ "node", "dist/server.js" ]