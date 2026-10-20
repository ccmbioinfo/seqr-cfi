import React from 'react'
import PropTypes from 'prop-types'
import { Input, Button, Header, Loader } from 'semantic-ui-react'

import RnaSeqOutliers from './RnaSeqOutliers'

class ExpressionOutliersContainer extends React.PureComponent {

  static propTypes = {
    individualGuid: PropTypes.string,
    familyGuid: PropTypes.string,
    genesById: PropTypes.object,
    data: PropTypes.arrayOf(PropTypes.object),
    load: PropTypes.func,
    loading: PropTypes.bool,
  }

  state = {
    pAdjustThreshold: 0.05,
  }

  handleSubmit = () => {
    const { load, individualGuid } = this.props
    const { pAdjustThreshold } = this.state

    load(
      individualGuid,
      pAdjustThreshold,
      'outliers',
    )
  }

  handleThresholdChange = (e, { value }) => {
    this.setState({
      pAdjustThreshold: Number(value),
    })
  }

  getLocation = ({ geneId }) => geneId

  render() {
    const {
      familyGuid,
      genesById,
      data,
      loading,
    } = this.props

    const { pAdjustThreshold } = this.state

    return (
      <>
        <Header as="h4">P-Adjust</Header>

        <Input
          type="number"
          step="0.01"
          min={0}
          max={1}
          value={pAdjustThreshold}
          onChange={this.handleThresholdChange}
        />

        <Button
          primary
          onClick={this.handleSubmit}
        >
          Apply
        </Button>

        {loading ? (
          <Loader active content="Loading" />
        ) : (
          <RnaSeqOutliers
            familyGuid={familyGuid}
            genesById={genesById}
            rnaSeqData={data}
            title="Expression Outliers"
            xField="zScore"
            searchType="genes"
            getLocation={this.getLocation}
          />
        )}
      </>
    )
  }

}

export default ExpressionOutliersContainer
