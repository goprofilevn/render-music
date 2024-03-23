import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import store from './redux/store'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from './redux/store'
import './App.scss'
import View from './pages/View'

const App = () => {
  return (
    <div className="App">
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <BrowserRouter>
            <View />
          </BrowserRouter>
        </PersistGate>
      </Provider>
    </div>
  )
}

export default App
