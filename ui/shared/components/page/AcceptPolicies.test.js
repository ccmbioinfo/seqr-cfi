import React from 'react'
import { shallow, configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { AcceptPolicies } from './AcceptPolicies'

configure({ adapter: new Adapter() })

test('shallow-render without crashing', () => {
  shallow(<AcceptPolicies user={{}} />)
  shallow(<AcceptPolicies user={{ currentPolicies: true }} />)
})
