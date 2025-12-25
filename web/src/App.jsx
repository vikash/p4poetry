import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Poems from './pages/Poems'
import PoemDetail from './pages/PoemDetail'
import Authors from './pages/Authors'
import AuthorDetail from './pages/AuthorDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="poems" element={<Poems />} />
          <Route path="poems/:slug" element={<PoemDetail />} />
          <Route path="authors" element={<Authors />} />
          <Route path="authors/:slug" element={<AuthorDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
