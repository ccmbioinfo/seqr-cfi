import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { FormSpy } from 'react-final-form'

import { configuredField } from 'shared/components/form/FormHelpers'
import { AddProjectButton } from 'shared/components/panel/search/ProjectsField'
import { ButtonLink } from 'shared/components/StyledComponents'
import { loadProjectGroupContext } from '../../reducers'
import ProjectFamiliesFilter from './ProjectFamiliesFilter'

const processAddedProject = result => ({ projectGuid: result.key })

const AddProjectFamiliesButton = props => <AddProjectButton processAddedElement={processAddedProject} {...props} />

const mapAddProjectDispatchToProps = {
  addProjectGroup: loadProjectGroupContext,
}

const validateFamilies = value => (value && value.familyGuids && value.familyGuids.length ? undefined : 'Families are required for all projects')

const PROJECT_FAMILIES_FIELD = {
  name: 'projectFamilies',
  component: ProjectFamiliesFilter,
  addArrayElement: connect(null, mapAddProjectDispatchToProps)(AddProjectFamiliesButton),
  validate: validateFamilies,
  isArrayField: true,
}

class AllProjectFamiliesField extends React.PureComponent {

  static propTypes = {
    numProjects: PropTypes.number,
  }

  state = { viewAllProjects: false }

  viewProjects = (e) => {
    e.preventDefault()
    this.setState({ viewAllProjects: true })
  }

  render() {
    const { numProjects } = this.props
    const { viewAllProjects } = this.state
    return numProjects < 20 || viewAllProjects ?
      configuredField(PROJECT_FAMILIES_FIELD) : <ButtonLink onClick={this.viewProjects} content={`Show all ${numProjects} searched projects`} />
  }

}

const SUBSCRIPTION = { values: true }

export default props => (
  <FormSpy subscription={SUBSCRIPTION}>
    {({ values }) => (
      <AllProjectFamiliesField {...props} numProjects={(values.projectFamilies || []).length} />
    )}
  </FormSpy>
)
