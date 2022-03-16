import { useState, useMemo, useEffect } from 'react'
import { gql } from '@apollo/client'
import { object, string } from 'yup'
import styled from 'styled-components'

import { Page, Title, Subtitle, StyledLogo, Card } from '~/styles/auth'
import { Typography, Alert, Button } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { theme } from '~/styles'
import { TextInput } from '~/components/form'
import { LOGIN_ROUTE } from '~/core/router'
import { useSignupMutation, CurrentUserFragmentDoc, Lago_Api_Error } from '~/generated/graphql'
import { onLogIn } from '~/core/apolloClient'
import { useShortcuts } from '~/hooks/ui/useShortcuts'

gql`
  mutation signup($input: RegisterUserInput!) {
    registerUser(input: $input) {
      token
      user {
        ...CurrentUser
      }
      organization {
        id
        name
      }
    }
  }

  ${CurrentUserFragmentDoc}
`

type Fields = { email: string; password: string; organizationName: string }
enum FORM_ERRORS {
  REQUIRED_EMAIL = 'requiredEmail',
  REQUIRED_PASSWORD = 'requiredPassword',
  INVALID_EMAIL = 'invalidEmail',
  REQUIRED_NAME = 'requiredName',
  LOWERCASE = 'text_620bc4d4269a55014d493f57',
  UPPERCASE = 'text_620bc4d4269a55014d493f7b',
  NUMBER = 'text_620bc4d4269a55014d493f8d',
  SPECIAL = 'text_620bc4d4269a55014d493fa0',
  MIN = 'text_620bc4d4269a55014d493fac',
}

const PASSWORD_VALIDATION = [
  FORM_ERRORS.LOWERCASE,
  FORM_ERRORS.SPECIAL,
  FORM_ERRORS.UPPERCASE,
  FORM_ERRORS.MIN,
  FORM_ERRORS.NUMBER,
]

const SignUp = () => {
  const { translate } = useI18nContext()
  const [signUp, { error: signUpError }] = useSignupMutation({
    context: { silentErrorCodes: [Lago_Api_Error.UserAlreadyExists] },
    onCompleted(res) {
      if (!!res?.registerUser) {
        onLogIn(res.registerUser.token, res.registerUser.user)
      }
    },
  })
  const [formFields, setFormFields] = useState<Fields>({
    email: '',
    password: '',
    organizationName: '',
  })
  const [isPswFocused, setIsPswFocused] = useState(false)
  const [errors, setErrors] = useState<FORM_ERRORS[]>([])
  const validationSchema = useMemo(
    () =>
      object().shape({
        email: string().email(FORM_ERRORS.INVALID_EMAIL).required(FORM_ERRORS.REQUIRED_EMAIL),
        organizationName: string().required(FORM_ERRORS.REQUIRED_NAME),
        password: string()
          .min(8, FORM_ERRORS.MIN)
          .matches(RegExp('(.*[a-z].*)'), FORM_ERRORS.LOWERCASE)
          .matches(RegExp('(.*[A-Z].*)'), FORM_ERRORS.UPPERCASE)
          .matches(RegExp('(.*\\d.*)'), FORM_ERRORS.NUMBER)
          .matches(RegExp('[!@#$%^&*(),.?":{}|<>]'), FORM_ERRORS.SPECIAL),
      }),
    []
  )
  const onSignUp = async () => {
    await signUp({
      variables: {
        input: formFields,
      },
    })
  }

  useEffect(() => {
    validationSchema
      .validate(formFields, { abortEarly: false })
      .catch((err) => err)
      .then((param) => {
        if (!!param?.errors && param.errors.length > 0) {
          setErrors(param.errors)
        } else {
          setErrors([])
        }
      })
  }, [formFields, validationSchema])

  useShortcuts([
    {
      keys: ['Enter'],
      disabled: errors.length > 0,
      action: onSignUp,
    },
  ])

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        <Title variant="headline">{translate('text_620bc4d4269a55014d493f12')}</Title>
        <Subtitle>{translate('text_620bc4d4269a55014d493fc9')}</Subtitle>

        {!!signUpError?.graphQLErrors &&
          signUpError?.graphQLErrors[0] &&
          signUpError?.graphQLErrors[0]?.extensions?.code === Lago_Api_Error.UserAlreadyExists && (
            <ErrorAlert type="danger">
              <Typography
                color="inherit"
                html={translate('text_622f7a3dc32ce100c46a5131', { link: LOGIN_ROUTE })}
              />
            </ErrorAlert>
          )}

        <Input
          name="organizationName"
          onChange={(value) => setFormFields((prev) => ({ ...prev, organizationName: value }))}
          label={translate('text_620bc4d4269a55014d493f26')}
          placeholder={translate('text_620bc4d4269a55014d493f65')}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <Input
          name="email"
          onChange={(value) => setFormFields((prev) => ({ ...prev, email: value }))}
          label={translate('text_620bc4d4269a55014d493f1e')}
          placeholder={translate('text_620bc4d4269a55014d493f49')}
        />

        <PasswordBlock>
          <TextInput
            value={formFields.password}
            password
            onChange={(value) => setFormFields((prev) => ({ ...prev, password: value }))}
            label={translate('text_620bc4d4269a55014d493f53')}
            placeholder={translate('text_620bc4d4269a55014d493f5b')}
            onFocus={() => setIsPswFocused(true)}
            onBlur={() => setIsPswFocused(false)}
          />
          <PasswordValidation $visible={isPswFocused}>
            {errors.some((err) => PASSWORD_VALIDATION.includes(err)) ? (
              PASSWORD_VALIDATION.map((err) => {
                const isErrored = errors.includes(err)

                return (
                  <ValidationLine key={err}>
                    <svg height={8} width={8}>
                      <circle
                        cx="4"
                        cy="4"
                        r="4"
                        fill={isErrored ? theme.palette.primary.main : theme.palette.grey[500]}
                      />
                    </svg>
                    <Typography
                      variant="caption"
                      color={isErrored ? 'textSecondary' : 'textPrimary'}
                    >
                      {translate(err)}
                    </Typography>
                  </ValidationLine>
                )
              })
            ) : (
              <StyledAlert type="success">{translate('text_620bc4d4269a55014d493fbe')}</StyledAlert>
            )}
          </PasswordValidation>
        </PasswordBlock>

        <SubmitButton disabled={errors.length > 0} fullWidth size="large" onClick={onSignUp}>
          {translate('text_620bc4d4269a55014d493fb5')}
        </SubmitButton>

        <Typography
          variant="caption"
          html={translate('text_620bc4d4269a55014d493fd4', { link: LOGIN_ROUTE })}
        />
      </Card>
    </Page>
  )
}

const Input = styled(TextInput)`
  && {
    margin-bottom: ${theme.spacing(4)};
  }
`

const PasswordBlock = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

const PasswordValidation = styled.div<{ $visible: boolean }>`
  margin-top: ${({ $visible }) => ($visible ? theme.spacing(4) : 0)};
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  max-height: ${({ $visible }) => ($visible ? '500px' : '0px')};
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  margin-bottom: ${({ $visible }) => ($visible ? theme.spacing(3) : 0)};
`

const StyledAlert = styled(Alert)`
  flex: 1;
  margin-bottom: ${theme.spacing(3)};
`

const ValidationLine = styled.div`
  display: flex;
  height: 20px;
  align-items: center;
  width: 50%;
  margin-bottom: ${theme.spacing(3)};

  svg {
    margin-right: ${theme.spacing(3)};
  }
`

const SubmitButton = styled(Button)`
  && {
    margin-bottom: ${theme.spacing(8)};
  }
`

const ErrorAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`

export default SignUp
