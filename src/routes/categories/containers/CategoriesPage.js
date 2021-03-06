import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'lodash/fp/compose'

import withFetcher from 'modules/endpoint/hocs/withFetcher'
import CategoriesMapModel from 'modules/endpoint/models/CategoriesMapModel'
import { Breadcrumbs, Page } from '@integreat-app/shared'

import CategoryList from 'routes/categories/components/CategoryList'
import Failure from '../../../modules/common/components/Failure'
import { Link } from 'redux-little-router'

const matchNothingRegexp = /a^/ // https://stackoverflow.com/questions/940822/regular-expression-syntax-for-match-nothing

export class CategoriesPage extends React.Component {
  static propTypes = {
    categories: PropTypes.instanceOf(CategoriesMapModel).isRequired,
    path: PropTypes.string
  }

  /**
   * Returns the content to be displayed, based on the current category, which is
   * a) page with information
   * b) table with categories
   * c) list with categories
   * @param category The current category
   * @return {*} The content to be displayed
   */
  getContent (category) {
    const categories = this.props.categories
    const children = categories.getChildren(category)

    if (category.isLeaf(categories)) {
      // last level, our category is a simple page
      return <Page title={category.title}
                   hijackRegExp={matchNothingRegexp}
                   content={category.content} />
    }
    // some level between, we want to display a list
    return <CategoryList
      categories={children.map(model => ({
        model,
        children: categories.getChildren(model)
      }))}
      title={category.title}
      content={category.content}
      hijackRegExp={matchNothingRegexp} />
  }

  getBreadcrumbs (category) {
    return this.props.categories.getAncestors(category).map(
      category => <Link key={category.path} href={category.path}>{category.title}</Link>
    )
  }

  render () {
    const category = this.props.categories.findCategoryByPath(this.props.path)
    if (!category) {
      return <Failure error='not-found:page.notFound' />
    }
    return <div>
      <Breadcrumbs>
        {this.getBreadcrumbs(category)}
      </Breadcrumbs>
      {this.getContent(category)}
    </div>
  }
}

const mapStateToProps = state => ({
  path: state.router.pathname
})

export default compose(
  connect(mapStateToProps),
  withFetcher('categories'),
  withFetcher('cityConfigs')
)(CategoriesPage)
