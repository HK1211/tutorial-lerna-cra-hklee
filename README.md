# 개발환경
```text
node - v16.10.0
npm - v7.24.0
yarn - v1.22.18
```

# 1. lerna 초기화 및 craco 설치
root 디렉토리를 만들고 package를 workspaces가 관리하도록 설정합니다.
```bash
mkdir lerna-cra-hklee && cd lerna-cra-hklee && npx lerna init && yarn add --dev craco -W && echo "node_modules" >> .gitignore && cd packages && yarn create react-app components --template typescript && yarn create react-app app --template typescript && cd .. && code . && exit
```

# 2. workspaces 기본 설정
```json
# root/lerna.json
{
  "packages": [
    "packages/*"
  ],
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true
}

# root/package.json
{
  "name": "@leehankue/root",
  "private": true,
  "devDependencies": {
    "craco": "^0.0.3",
    "lerna": "^4.0.0"
  },
  "workspaces": {
    "packages": ["packages/**"]
  }
}
```

# 3. packages의 각 package.json name 수정하기
```json
// root/packages/app/package.josn
{
  "name": "@leehankue/app",
  (...)
  "dependencies": {
    (...)
    "@leehankue/components": "^0.1.0"
  },
}
// root/packages/components/package.josn
{
  "name": "@leehankue/monorepo-test-components",
  "main": "./src/index.tsx",
  (...)
}
// root/package.json
{
 (...)
  "scripts": {
    "start": "lerna exec --scope @leehankue/app -- yarn start"
  },
 (...)
}
```

root 디렉토리에서 yarn start
<img src="./readme/firstStart.png">

# 4. 상호작용하는 packages 구축

### [4-1]components package 에서 Button 컴포넌트 만들기
```typescript
// root/packages/components/src/components/Button.tsx
import React from 'react'

interface Props extends React.DOMAttributes<HTMLButtonElement> {
    children?:React.ReactNode;
}

const Button: React.FC<Props> = ({...props}) => {
  return (
    <button {...props}>{props.children}</button>
  )
}

export default Button
```
```typescript
// root/packages/components/src/index.tsx
import Button from './components/Button';

export { Button };
```
```json
// root/packages/components/package.json
{
  (...)
  "main": "./src/index.tsx",
  (...)
}
```

### [4-2]app package 에서 Button 컴포넌트 사용하기
```typescript
// root/packages/app/src/App.tsx
import React from 'react';
import { Button } from '@leehankue/monorepo-test-components';
import './App.css';

function App() {
  const [state, setState] = React.useState(0);
  return (
    <div className="App">
     {state}
     <Button onClick={()=>setState(s=>s+1)}>Click me!</Button>
    </div>
  );
}

export default App;
```

여기까지 진행했다면, app의 app.tsx에서 components를 import 할 수 없다는 오류 메세지가 보인다.
<img src="./readme/errorDependences.png">

# 패키지간 의존성 주입
Injecting dependency components into app
```bash
lerna add @leehankue/monorepo-test-components --scope=@leehankue/app
```
또는 한번에 해결
```bash
yarn lerna bootstrap
```

# webpack Loader Override
웹팩 재정의 이슈
```
yarn start

# 오류 메세지
Compiled with problems:X

ERROR in ../components/src/components/Button.tsx 5:0

Module parse failed: The keyword 'interface' is reserved (5:0)
File was processed with these loaders:
 * ../../node_modules/@pmmmwh/react-refresh-webpack-plugin/loader/index.js
 * ../../node_modules/source-map-loader/dist/cjs.js
You may need an additional loader to handle the result of these loaders.
| import React from 'react'
| 
> interface Props extends React.DOMAttributes<HTMLButtonElement> {
|     children?:React.ReactNode;
| }
```

CRA에는 이미 로더가 설정되어 있는 webpack 구성이 있으며, 이를 재정의(override) 해야합니다.
.jsx 및 typescript으로 작성되었으므로 사용하기 전에 트랜스파일해야 하므로
이 애플리케이션에서 Loader를 사용하기를 원합니다.

```bash
$ cd packages/app && touch craco.config.js
```
웹팩 재정의 하기
```javascript
// root/packages/app/craco.config.js
const path = require('path');
const { getLoader, loaderByName } = require('@craco/craco');

const packages = [];
packages.push(path.join(__dirname, "../components"));

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            const { isFound, match } = getLoader(webpackConfig,loaderByName('babel-loader'));
            if(isFound) {
                const include = Array.isArray(match.loader.include)
                    ? match.loader.include
                    : [match.loader.include];

                match.loader.include = include.concat(packages);

                return webpackConfig;
            }
        }
    }
}
```
app > package.json > scripts 수정하기
```json
{
    (...)
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test",
    "eject": "craco eject"
  },
    (...)
}
```
app 실행하기

```bash
yarn start
```

# 결과
<img src="./readme/done.png">
