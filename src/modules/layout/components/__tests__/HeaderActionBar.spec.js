import React from 'react'
import HeaderActionBar from '../HeaderActionBar'
import { shallow } from 'enzyme'
import HeaderActionItem from '../../HeaderActionItem'

describe('HeaderActionBar', () => {
  it('should match snapshot', () => {
    const component = shallow(
      <HeaderActionBar className='testClass' items={[
        new HeaderActionItem({ iconSrc: 'icon1', href: 'link1' }),
        new HeaderActionItem({ iconSrc: 'icon2', dropDownNode: <div id='2' /> }),
        new HeaderActionItem({ iconSrc: 'icon3', dropDownNode: <div id='3' /> })
      ]} />
    )
    expect(component).toMatchSnapshot()
  })
})
