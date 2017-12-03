import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'redux-little-router'

import EventModel from '../../endpoints/models/EventModel'
import Caption from './Caption'

import style from './EventsList.css'

import EventPlaceholder1 from '../../components/Content/assets/EventPlaceholder1.jpg'
import EventPlaceholder2 from '../../components/Content/assets/EventPlaceholder2.jpg'
import EventPlaceholder3 from '../../components/Content/assets/EventPlaceholder3.jpg'
import RemoteContent from './RemoteContent'

class Event extends React.Component {
  static propTypes = {
    event: PropTypes.instanceOf(EventModel).isRequired,
    parentUrl: PropTypes.string.isRequired,
    thumbnailPlaceholder: PropTypes.number.isRequired,
    language: PropTypes.string.isRequired
  }

  getUrl () {
    return `${this.props.parentUrl}/${this.props.event.id}`
  }

  getEventPlaceholder () {
    return (
      this.props.thumbnailPlaceholder === 0 ? EventPlaceholder1
        : this.props.thumbnailPlaceholder === 1 ? EventPlaceholder2
        : EventPlaceholder3
    )
  }

  render () {
    return (
      <Link href={this.getUrl()}>
        <div className={style.event}>
          <img className={style.eventThumbnail} src={this.props.event.thumbnail || this.getEventPlaceholder()}/>
          <div className={style.eventDescription}>
            <div className={style.eventTitle}>{this.props.event.title}</div>
            <div className={style.eventDate}>{this.props.event.getDate(this.props.language)}, {this.props.event.address}</div>
            <RemoteContent dangerouslySetInnerHTML={{__html: this.props.event.excerpt}}/>
          </div>
        </div>
      </Link>
    )
  }
}

class EventList extends React.Component {
  static propTypes = {
    events: PropTypes.arrayOf(PropTypes.shape({
      event: PropTypes.instanceOf(EventModel).isRequired,
      thumbnailPlaceholder: PropTypes.number.isRequired
    })).isRequired,
    url: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired
  }

  render () {
    return (
      <div className={style.list}>
        <Caption title={'Events'}/>
        <div className={style.horizontalLine}/>
        { this.props.events
          ? this.props.events.map((event) =>
            <Event key={event.event.id}
                   event={event.event}
                   parentUrl={this.props.url}
                   thumbnailPlaceholder={event.thumbnailPlaceholder}
                   language={this.props.language}/>)
          : <div>Currently there are no events</div>
        }
      </div>
    )
  }
}

export default EventList
