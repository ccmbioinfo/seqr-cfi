import React from 'react'
import PropTypes from 'prop-types'
import { Input, Button, Header, Loader } from 'semantic-ui-react'

import RnaSeqOutliers from './RnaSeqOutliers'

class ExpressionOutliersContainer extends React.PureComponent {
  state = {
    pAdjustThreshold: 0.05,
  }

  handleSubmit = () => {
    this.props.load(
      this.props.individualGuid,
      this.state.pAdjustThreshold,
      "outliers"
    )
  }

  render() {
    const {
      familyGuid,
      genesById,
      data,
      loading,
    } = this.props

    return (
      <>
        <Header as="h4">P-Adjust</Header>

        <Input
          type="number"
          step="0.01"
          min={0}
          max={1}
          value={this.state.pAdjustThreshold}
          onChange={(e, { value }) => {
            this.setState({
              pAdjustThreshold: Number(value),
            })
          }}
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
              getLocation={({ geneId }) => geneId}
            />
          )}
      </>
    )
  }
}

ExpressionOutliersContainer.propTypes = {
  individualGuid: PropTypes.string,
  familyGuid: PropTypes.string,
  genesById: PropTypes.object,
  data: PropTypes.array,
  load: PropTypes.func,
  loading: PropTypes.bool,
}

export default ExpressionOutliersContainer