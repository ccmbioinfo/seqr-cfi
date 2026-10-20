/* eslint-disable max-classes-per-file */
/* eslint-disable react-perf/jsx-no-new-array-as-prop */
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { Loader, Grid, Dropdown } from 'semantic-ui-react'

import {
  getGenesById,
  getIndividualsByGuid,
  getRnaSeqSignificantJunctionData,
} from 'redux/selectors'
import DataLoader from 'shared/components/DataLoader'
import FamilyReads from 'shared/components/panel/family/FamilyReads'
import RnaSeqJunctionOutliersTable from 'shared/components/table/RnaSeqJunctionOutliersTable'
import ExpressionOutliersContainer from './ExpressionOutliersContainer'
import SpliceOutliersContainer from './SpliceOutliersContainer'
import { loadRnaSeqData } from '../reducers'
import {
  getExpressionDataLoading,
  getSpliceDataLoading,
  getTissueOptionsByIndividualGuid,
  getFlattenedExpressionOutliersByIndividual,
  getFlattenedSpliceOutliersByIndividual,
} from '../selectors'

const TissueContainer = styled.div`
  margin-bottom: 1rem;
`

class BaseRnaSeqResultPage extends React.PureComponent {

  static propTypes = {
    familyGuid: PropTypes.string,
    individual: PropTypes.shape({
      individualGuid: PropTypes.string,
      familyGuid: PropTypes.string,
    }),
    expressionOutliers: PropTypes.arrayOf(PropTypes.object),
    spliceOutliers: PropTypes.arrayOf(PropTypes.object),
    significantJunctionOutliers: PropTypes.arrayOf(PropTypes.object),
    genesById: PropTypes.object,
    tissueOptions: PropTypes.arrayOf(PropTypes.object),
    load: PropTypes.func,
    expressionLoading: PropTypes.bool,
    spliceLoading: PropTypes.bool,
  }

  state = {
    selectedDataType: null,
  }

  onTissueChange = (e, data) => {
    this.setState({ selectedDataType: data.value })
  }

  render() {
    const {
      familyGuid,
      individual,
      expressionOutliers,
      spliceOutliers,
      significantJunctionOutliers,
      genesById,
      tissueOptions = [],
      load,
      expressionLoading,
      spliceLoading,
    } = this.props

    const { selectedDataType } = this.state

    const showDataType = selectedDataType || tissueOptions[0].value
    const [showTissueType, showSequencingType] = showDataType.split('-')

    const expressionData = (expressionOutliers || []).filter(
      outlier => outlier.tissueType === showTissueType &&
        outlier.sequencingType === showSequencingType,
    )

    const spliceData = (spliceOutliers || []).filter(
      outlier => outlier.tissueType === showTissueType &&
        outlier.sequencingType === showSequencingType,
    )

    const tableData = significantJunctionOutliers.filter(
      outlier => outlier.tissueType === showTissueType &&
        outlier.sequencingType === showSequencingType,
    )

    return (
      <div>
        <TissueContainer>
          {tissueOptions?.length > 1 ? (
            <Dropdown
              value={showDataType}
              options={tissueOptions}
              onChange={this.onTissueChange}
            />
          ) : tissueOptions[0]?.text}
        </TissueContainer>

        <React.Suspense fallback={<Loader />}>
          <Grid>
            <Grid.Row divided columns={2}>
              <Grid.Column width={8}>
                <ExpressionOutliersContainer
                  familyGuid={familyGuid}
                  genesById={genesById}
                  tissueType={showTissueType}
                  sequencingType={showSequencingType}
                  data={expressionData}
                  load={load}
                  individualGuid={individual.individualGuid}
                  loading={expressionLoading}
                />
              </Grid.Column>

              <Grid.Column width={8}>
                <SpliceOutliersContainer
                  familyGuid={familyGuid}
                  genesById={genesById}
                  tissueType={showTissueType}
                  sequencingType={showSequencingType}
                  data={spliceData}
                  load={load}
                  individualGuid={individual.individualGuid}
                  loading={spliceLoading}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </React.Suspense>

        {tableData.length > 0 && (
          <FamilyReads
            layout={RnaSeqJunctionOutliersTable}
            noTriggerButton
            data={tableData}
            defaultSortColumn="pValue"
            maxHeight="600px"
          />
        )}
      </div>
    )
  }

}

class RnaSeqResultPage extends React.PureComponent {

  static propTypes = {
    individual: PropTypes.shape({
      individualGuid: PropTypes.string,
      familyGuid: PropTypes.string,
    }),
    load: PropTypes.func,
    loading: PropTypes.bool,
    expressionOutliers: PropTypes.arrayOf(PropTypes.object),
    spliceOutliers: PropTypes.arrayOf(PropTypes.object),
    expressionLoading: PropTypes.bool,
    spliceLoading: PropTypes.bool,
  }

  state = {
    pAdjustThreshold: 0.05,
  }

  setPAdjustThreshold = (pAdjustThreshold) => {
    this.setState({ pAdjustThreshold })
  }

  render() {
    const {
      individual,
      load,
      loading,
      expressionLoading,
      spliceLoading,
      expressionOutliers,
      spliceOutliers,
      ...props
    } = this.props

    const { pAdjustThreshold } = this.state

    const initialLoading =
      !expressionOutliers.length &&
      !spliceOutliers.length &&
      (expressionLoading || spliceLoading)

    return (
      <DataLoader
        content={expressionOutliers.length || spliceOutliers.length}
        contentId={individual.individualGuid}
        load={load}
        loading={initialLoading}
      >
        <BaseRnaSeqResultPage
          familyGuid={individual.familyGuid}
          individual={individual}
          expressionOutliers={expressionOutliers}
          spliceOutliers={spliceOutliers}
          load={load}
          pAdjustThreshold={pAdjustThreshold}
          setPAdjustThreshold={this.setPAdjustThreshold}
          expressionLoading={expressionLoading}
          spliceLoading={spliceLoading}
          {...props}
        />
      </DataLoader>
    )
  }

}

const mapStateToProps = (state, { match }) => ({
  individual: getIndividualsByGuid(state)[match.params.individualGuid],
  expressionOutliers:
    getFlattenedExpressionOutliersByIndividual(state)[match.params.individualGuid] || [],
  spliceOutliers:
    getFlattenedSpliceOutliersByIndividual(state)[match.params.individualGuid] || [],
  significantJunctionOutliers:
    getRnaSeqSignificantJunctionData(state)[match.params.individualGuid] || [],
  genesById: getGenesById(state),
  tissueOptions: getTissueOptionsByIndividualGuid(state)[match.params.individualGuid],
  loading: getExpressionDataLoading(state) || getSpliceDataLoading(state),
  expressionLoading: getExpressionDataLoading(state),
  spliceLoading: getSpliceDataLoading(state),
})

const mapDispatchToProps = {
  load: loadRnaSeqData,
}

export default connect(mapStateToProps, mapDispatchToProps)(RnaSeqResultPage)
