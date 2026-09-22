import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { Loader, Grid, Dropdown, Input, Button, Header } from 'semantic-ui-react'

import { getGenesById, getIndividualsByGuid, getRnaSeqSignificantJunctionData } from 'redux/selectors'
import DataLoader from 'shared/components/DataLoader'
import FamilyReads from 'shared/components/panel/family/FamilyReads'
import RnaSeqJunctionOutliersTable from 'shared/components/table/RnaSeqJunctionOutliersTable'
import ExpressionOutliersContainer from './ExpressionOutliersContainer'
import SpliceOutliersContainer from './SpliceOutliersContainer'
import { loadRnaSeqData } from '../reducers'
import { getExpressionDataLoading, getSpliceDataLoading,
  getTissueOptionsByIndividualGuid, 
  getFlattenedExpressionOutliersByIndividual, 
  getFlattenedSpliceOutliersByIndividual 
} from '../selectors'

const TissueContainer = styled.div`
  margin-bottom: 1rem;
`

class BaseRnaSeqResultPage extends React.PureComponent {

  static propTypes = {
    familyGuid: PropTypes.string,
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
    initialLoadComplete: false,
  }

  onTissueChange = (e, data) => {
    this.setState({ selectedDataType: data.value })
  }

  render() {
    const { familyGuid, expressionOutliers, spliceOutliers, 
      significantJunctionOutliers, genesById, tissueOptions = [], 
      load, expressionLoading, spliceLoading } = this.props
    const { selectedDataType } = this.state
    const showDataType = selectedDataType || tissueOptions[0].value
    const [showTissueType, showSequencingType] = showDataType.split('-')

    const dataByType = {
      outliers: expressionOutliers,
      spliceOutliers,
    }

    const expressionData =
      (dataByType.outliers || []).filter(
        outlier =>
          outlier.tissueType === showTissueType &&
          outlier.sequencingType === showSequencingType,
      )

    const spliceData =
      (dataByType.spliceOutliers || []).filter(
        outlier =>
          outlier.tissueType === showTissueType &&
          outlier.sequencingType === showSequencingType,
      )

    const tableData = significantJunctionOutliers.reduce(
      (acc, outlier) => (
        (outlier.tissueType === showTissueType && outlier.sequencingType === showSequencingType) ?
          [...acc, outlier] : acc
      ), [],
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
          ) : tissueOptions[0].text}
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
                  individualGuid={this.props.individual.individualGuid}
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
                  individualGuid={this.props.individual.individualGuid}
                  loading={spliceLoading}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </React.Suspense>
        {(tableData.length > 0) && (
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
          expressionOutliers={expressionOutliers}
          spliceOutliers={spliceOutliers}
          load={load}
          individual={individual}
          pAdjustThreshold={this.state.pAdjustThreshold}
          setPAdjustThreshold={this.setPAdjustThreshold}
          expressionLoading={expressionLoading}
          spliceLoading={spliceLoading}
          {...props}
        />
      </DataLoader>
    )
  }
}

RnaSeqResultPage.propTypes = {
  individual: PropTypes.object,
  load: PropTypes.func,
  loading: PropTypes.bool,
  expressionOutliers: PropTypes.arrayOf(PropTypes.object),
  spliceOutliers: PropTypes.arrayOf(PropTypes.object),
  expressionLoading: PropTypes.bool,
  spliceLoading: PropTypes.bool,
}

const mapStateToProps = (state, { match }) => {
  return {
  individual: getIndividualsByGuid(state)[match.params.individualGuid],
  expressionOutliers: getFlattenedExpressionOutliersByIndividual(state)[match.params.individualGuid] || [],
  spliceOutliers: getFlattenedSpliceOutliersByIndividual(state)[match.params.individualGuid] || [],
  significantJunctionOutliers: getRnaSeqSignificantJunctionData(state)[match.params.individualGuid] || [], //have to fix this to get table
  genesById: getGenesById(state),
  tissueOptions: getTissueOptionsByIndividualGuid(state)[match.params.individualGuid],
  loading: getExpressionDataLoading(state) || getSpliceDataLoading(state),
  expressionLoading: getExpressionDataLoading(state),
  spliceLoading: getSpliceDataLoading(state),
}}

const mapDispatchToProps = {
  load: loadRnaSeqData,
}

export default connect(mapStateToProps, mapDispatchToProps)(RnaSeqResultPage)
