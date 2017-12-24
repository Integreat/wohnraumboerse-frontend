import React from 'react'
import PropTypes from 'prop-types'
import Spinner from 'react-spinkit'
import chunkedRequest from 'chunked-request'
import { connect } from 'react-redux'
import escapeRegExp from 'escape-string-regexp'
import { isEmpty } from 'lodash/lang'
import compose from 'lodash/fp/compose'
import { translate } from 'react-i18next'

import withFetcher from 'modules/endpoint/hocs/withFetcher'
import LOCATIONS_ENDPOINT from 'modules/endpoint/endpoints/location'
import CATEGORIES_ENDPOINT from 'modules/endpoint/endpoints/categories'
import LocationModel from 'modules/endpoint/models/LocationModel'
import style from './PdfFetcherPage.css'
import Error from 'modules/common/containers/Error'
import CategoryModel from 'modules/endpoint/models/CategoryModel'

class PdfFetcherPage extends React.Component {
  static propTypes = {
    locations: PropTypes.arrayOf(PropTypes.instanceOf(LocationModel)).isRequired,
    categories: PropTypes.arrayOf(PropTypes.instanceOf(CategoryModel)).isRequired,
    location: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired
  }

  constructor (params) {
    super(params)
    this.state = {pdf: '', loading: false}
  }

  componentWillMount () {
    this.fetchUrl(CategoryModel.getCategoryByPath(this.props.categories, this.props.path))
  }

  addCategoryIdsRecursively (categoryIds, currentCategory) {
    currentCategory.children.forEach((id) => {
      const child = CategoryModel.getCategoryById(this.props.categories, id)
      categoryIds.push(child.id)
      this.addCategoryIdsRecursively(categoryIds, child)
    })
  }

  getFont () {
    // todo: This still doesn't work perfect for ar. Improve this in WEBAPP-84
    switch (this.props.language) {
      case 'ar':
        return 'aefurat'
      case 'fa':
        return 'dejavusans'
      default:
        return ''
    }
  }

  getLocationTitle (category) {
    const location = this.props.locations.find((location) => location.code === category.title)
    if (location) {
      return location.name
    } else {
      console.warn('Couldn\'t find the corresponding LocationModel. Using the category title instead...')
      return category.title
    }
  }

  static isRootCategory (category) {
    return category.id === 0
  }

  fetchUrl (category) {
    const url = `https://cms.integreat-app.de/${this.props.location}/wp-admin/admin-ajax.php`
    const categoryIds = []
    const requestType = 'page' /* 'allpages' is available for the root page, but 'allpages' doesn't work with all
                                  languages, so we just always use 'page' as requestType. */
    const font = this.getFont()
    const title = PdfFetcherPage.isRootCategory(category) ? this.getLocationTitle(category) : category.title
    const toc = isEmpty(category.children) ? 'false' : 'true'

    this.setState(Object.assign({}, this.state, {loading: category}))

    if (!PdfFetcherPage.isRootCategory(category)) {
      categoryIds.push(category.id)
    }
    this.addCategoryIdsRecursively(categoryIds, category)

    const params = {
      action: 'frontEndDownloadPDF',
      requestType: requestType,
      myContent: categoryIds.join(','),
      pdfOptions: `${toc},${title},${category.id}_file,,`,
      'ajaxVars[ajaxurl]': `https://cms.integreat-app.de/${this.props.location}/wp-admin/admin-ajax.php`,
      font,
      fontcolor: '',
      bgcolor: '',
      linkcolor: ''
    }

    const body = new URLSearchParams(params)
    // Currently the backend can only use the 'Referer' header, to determine which language the PDF should have (not sure).
    // We cannot modify the 'Referer'-header and we are just lucky that it works I think.
    // The old JQuery webapp also sended following cookies to the backend which it maybe used to determine the language.
    // 'Cookie': `_icl_current_language=${this.props.languageCode}; integreat_lang=${this.props.languageCode}`
    let text = ''
    const decoder = new TextDecoder()
    chunkedRequest({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;' // Currently IE11 does another request which fails because it appends a \n before Content-Type
        // But other request succeeds so let's ignore it
      },
      body,
      chunkParser: (bytes) => { text += decoder.decode(bytes) },
      onComplete: () => {
        if (!category === this.state.loading) {
          return
        }

        const regex = escapeRegExp(`https://cms.integreat-app.de/${this.props.location}/wp-content/uploads/`) + '[\\w|/|-]*\\.pdf'
        const match = text.match(new RegExp(regex))

        if (isEmpty(match)) {
          console.error('No match found for PDF-Url.')
          this.setState({loading: false})
          return
        }

        this.setState({pdf: match[0], loading: false})
        // PdfProcessingPage shouldn't appear in browser history
        window.location.replace(match[0])
      }
    })
  }

  render () {
    const {t} = this.props
    if (this.state.loading) {
      return <div className={style.pdfFetcher}>
        <p>{t('creatingPdf')}</p>
        <Spinner name='line-scale-party' />
      </div>
    } else if (!this.state.pdf) {
      return <Error error='errors:page.loadingFailed' />
    } else {
      return <div className={style.pdfFetcher}>
        <p>{t('downloadPdfAt')}</p>
        <p><a href={this.state.pdf}>{this.state.pdf}</a></p>
      </div>
    }
  }
}

const mapStateToProps = (state) => ({
  location: state.router.params.location,
  language: state.router.params.language,
  path: state.router.params['_'] // _ contains all the values from *
})

export default compose(
  connect(mapStateToProps),
  withFetcher(LOCATIONS_ENDPOINT),
  withFetcher(CATEGORIES_ENDPOINT),
  translate('pdf-fetcher')
)(PdfFetcherPage)
